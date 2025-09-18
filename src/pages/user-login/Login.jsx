import React, { useState } from 'react'
import useLoginStore from '../../store/useLoginStore';
import countries from '../../utils/countriles';
import { avatars } from '../../utils/formatTime';
import Spinner from '../../utils/Spinner';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { sendOtp, verifyOtp, updateUserProfile } from '../../pages/services/user.service';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaChevronDown, FaUser, FaArrowLeft, FaPlus } from "react-icons/fa";
//  Validationschema
const loginvalidationSchema = yup.object().shape({
  phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, 'Phone number must be digit').transform((value, originalValue) =>
    originalValue.trim() === '' ? null : value
  ),
  email: yup.string().nullable().notRequired().email('Invalid email').transform((value, originalValue) =>
    originalValue.trim() === '' ? null : value
  )
}).test('at-least-one', 'Either Email or Phone number is required', function (value) {
  // Custom email validation logic
  return !!(value.phoneNumber || value.email)
});

// Otp Validation Schema
const otpValidationSchema = yup.object().shape({
  otp: yup.string().length(6, 'OTP must be 6 digits').required('OTP is required')
});

// Profile Validation
const profileValidationSchema = yup.object().shape({
  username: yup.string().required('Username is required'),
  agreed: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions') // must be true
});

const Login = () => {
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } = useLoginStore();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [selectCountry, setSelectCountry] = useState(countries[0]);
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [email, setEmail] = React.useState('');
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [selectedAvatar, setSelectedAvatar] = React.useState([avatars[0]]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = React.useState('');
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register: loginRegister,
    handleSubmit: handleloginSubmit,
    formState: { errors: loginErrors },
  } = useForm({ resolver: yupResolver(loginvalidationSchema) })
  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({ resolver: yupResolver(otpValidationSchema) })
  const {
    register: profileRegister,
    handleSubmit: handleprofileSubmit,
    formState: { errors: profileErrors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
    defaultValues: {
      agreed: false, // initialize checkbox
    },
  })

  const filterCountries = countries
    .filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
    )
    .sort((a, b) => {
      const term = searchTerm.toLowerCase();

      // 1. Names starting with the search term
      const aNameStart = a.name.toLowerCase().startsWith(term) ? 0 : 1;
      const bNameStart = b.name.toLowerCase().startsWith(term) ? 0 : 1;
      if (aNameStart !== bNameStart) return aNameStart - bNameStart;

      // 2. Names including the search term anywhere
      const aNameIncludes = a.name.toLowerCase().includes(term) ? 0 : 1;
      const bNameIncludes = b.name.toLowerCase().includes(term) ? 0 : 1;
      if (aNameIncludes !== bNameIncludes) return aNameIncludes - bNameIncludes;

      // 3. Dial codes: exact match first, then includes
      const normalizedTerm = term.startsWith('+') ? term : '+' + term;
      const aDialExact = a.dialCode.toString() === normalizedTerm ? 0 : 1;
      const bDialExact = b.dialCode.toString() === normalizedTerm ? 0 : 1;
      if (aDialExact !== bDialExact) return aDialExact - bDialExact;

      const aDialIncludes = a.dialCode.toString().includes(searchTerm) ? 0 : 1;
      const bDialIncludes = b.dialCode.toString().includes(searchTerm) ? 0 : 1;
      if (aDialIncludes !== bDialIncludes) return aDialIncludes - bDialIncludes;

      return 0; // fallback
    });

  const onLoginSubmit = async () => {
    try {
      setLoading(true);
      if (email) {
        const response = await sendOtp(null, null, email)
        if (response.status === 'success') {
          toast.info('OTP is sent to your Email');
          setUserPhoneData({ email });
          setStep(2); // Move to OTP step
        }
      }
      else {
        const response = await sendOtp(phoneNumber, selectCountry.dialCode, null);
        if (response.status === 'success') {
          toast.info('OTP is sent to your PhoneNumber');
          setUserPhoneData({ phoneNumber, phoneSuffix: selectCountry.dialCode });
        } else {
          toast.error('Failed to send OTP');
        }
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error('Phone number is required');
      }
      const otpString = otp.join('');
      let response;
      if (userPhoneData.email) {
        response = await verifyOtp(null, null, userPhoneData.email, otpString);
      }
      else {
        response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, null, otpString);
      }
      if (response.status === 'success') {
        toast.success('OTP verified successfully');
        const userData = response.data?.user
        if (userData?.username && userData?.profilePicture) {
          setUser({ ...userData, isAuthenticated: true });
          toast.success('Welcome back to ChatSphere');
          navigate('/');
          resetLoginState();
        } else {
          setStep(3); // Move to profile setup step
        }
        // Proceed with login
      } else {
        toast.error('Failed to verify OTP');
      }
    } catch (error) {
      console.error('OTP submission error:', error);
      setError('OTP submission failed', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('username', data?.username);
      formData.append('agreed', data?.agreed);
      if (profilePictureFile) {
        formData.append('media', profilePictureFile);
      } else {
        formData.append('avatarUrl', selectedAvatar);
      }
      const response = await updateUserProfile(formData);
      if (response.status === 'success') {
        // Set user data and authentication state
        setUser(response.data?.user);
        console.log('User set in store, isAuthenticated should be true now');
        toast.success('Profile updated successfully');
        navigate('/');
        resetLoginState();
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Profile update failed', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue(`otp`, newOtp.join('')); // Update the form value
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  }

  const handleback = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setOtpValue('otp', '');
    setError('')
  }

  const Progressbar = () => (
    <div className={`w-full h-2.5 rounded-full mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
      <div className={'h-2.5 rounded-full bg-green-500 transition-all duration-500 ease-in-out'}
        style={{ width: `${(step / 3) * 100}%` }}></div>
    </div>
  )

  return (
    <div className={`min-h-screen min-w-screen flex items-center justify-center p-4 overflow-hidden 
    ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-green-400 to-blue-500'}`}>
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        {/* Your form or content goes here */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2, type: 'spring', damping: 20 }}
          className={"h-24 w-24 mb-6 mx-auto bg-green-500 rounded-full flex flex-col items-center justify-center"}>
          <FaWhatsapp className={'w-16 h-16 text-white'} />
        </motion.div>
        <h1 className={`text-center text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>ChatSphere Login</h1>
        <Progressbar />
        {error && <p className={`text-red-500 text-center my-4`}>{error}</p>}
        {step === 1 && (
          <form onSubmit={handleloginSubmit(onLoginSubmit)} >
            <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Enter Your PhoneNumber to receive Otp</p>
            <div className={'relative'}>
              <div className={'flex'}>
                <div className={'w-1/3'}>
                  {/* ${console.log(theme)} */}
                  <button type="button" className={`flex-shrink-0 inline-flex items-center z-10 py-2.5 px-4 text-sm font-medium text-center'
                    ${` ${theme === 'dark' ?
                      'bg-gray-800 text-gray-100 border-gray-600' :
                      'bg-gray-300 text-gray-800 border-gray-300'} 
                    rounded-l-lg border focus:ring-2 focus:outline-none focus:ring-gray-100`}
                  `} onClick={() => setShowDropdown(!showDropdown)}>
                    <span className='flex'>
                      <img src={selectCountry.flag} alt="" width={'10'} />{selectCountry.dialCode}
                      <FaChevronDown className={`ml-2 `} />
                    </span>
                  </button>
                  {showDropdown && (
                    <div className={`absolute z-10 mt-1 w-full 
                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600' :
                        'bg-white border-gray-300'}
                     border max-h-60 overflow-auto rounded-md shadow-lg`}>
                      <div className={`sticky top-0 p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                        <input type="text" placeholder="Search Countries..." value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full p-2 border-b 
                         ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'}
                         rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500`} />
                      </div>
                      {filterCountries.map(country => (
                        <button key={country.alpha2}
                          type="button"
                          className={` w-full flex gap-1 text-left px-3 py-2 
                          ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}
                        focus:outline-none focus:bg-gray-100`}
                          onClick={() => {
                            setSelectCountry(country)
                            setShowDropdown(false)
                          }}>
                          <img src={country.flag} alt="" width={'20'} />
                          <span>{country.dialCode}</span>
                          <span>{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="text" {...loginRegister('phoneNumber')}
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-2/3 px-4 py-2 border
                ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' :
                      'border-gray-300 bg-white text-gray-800'}
                rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                ${loginErrors.phoneNumber ? 'border-red-500' : ''}`} />
              </div>
              {loginErrors.phoneNumber && (<p className="text-red-500 text-sm">{loginErrors.phoneNumber.message}</p>)}
            </div>
            {/* Divider with or */}
            <div className='flex items-center my-4'>
              <div className="flex-grow h-px  bg-gray-300" />
              <span className={`mx-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>or</span>
              <div className="flex-grow h-px  bg-gray-300" />
            </div>

            {/* Email Input box  */}
            <div className={`flex items-center border rounded-md px-3 py-2
                ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' :
                'border-gray-300 bg-white text-gray-800'}
                rounded-md focus:outline-none focus:ring-2 focus:ring-green-500
                `}>
              <FaUser className={`mr-2 text-gray-400 ${(theme === 'dark') ? 'text-gray-400' : 'text-gray-500'}`} />
              <input type="email" {...loginRegister('email')}
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-transparent
                ${theme === 'dark' ? ' text-white' :
                    'text-black'}
                ${loginErrors.email ? 'border-red-500' : ''}
                focus:outline-none`} />
              {loginErrors.email && (<p className="text-red-500 text-sm">{loginErrors.email?.message}</p>)}
            </div>
            <button
              type={'submit'}
              className='w-full bg-green-500 text-white font-semibold py-2 rounded-md my-2
             hover:bg-green-600 transition'>
              {loading ? <Spinner /> : 'Send Otp'}
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)}>
            <p className={'text-center' + (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
              Please Enter Six Digit Otp send to your {userPhoneData ? userPhoneData?.phoneSuffix : 'Email'}{""}
              {userPhoneData.phoneNumber && userPhoneData?.phoneNumber}
            </p>
            <div className='flex justify-center mt-4'>
              {otp.map((key, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={key}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className={`w-12 h-12 text-center border mx-1
                    ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' :
                      'border-gray-300 bg-white text-gray-800'}
                    rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${otpErrors.otp ? 'border-red-500' : ''}`}
                />
              ))}
              {otpErrors.otp && (<p className="text-red-500 text-sm">{otpErrors.otp.message}</p>)}
            </div>
            <button
              type={'submit'}
              className='w-full bg-green-500 text-white font-semibold py-2 rounded-md my-2
             hover:bg-green-600 transition'>
              {loading ? <Spinner /> : 'Verify Otp'}
            </button>
            <button
              type='button'
              onClick={handleback}
              className={'w-full m-2' + (theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700')
                + ' font-semibold flex items-center justify-center py-2 rounded-md hover:bg-gray-300 transition'}>
              <FaArrowLeft className='mr-2' />
              Wrong Number ? Go back
            </button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleprofileSubmit(onProfileSubmit)} className='space-y-4'>
            <div className={'flex flex-col items-center mb-4'}>
              <div className={'relative w-24 h-24 mb-2'}>
                <img src={profilePicture || selectedAvatar} alt="profile"
                  className="object-cover w-full h-full rounded-full" />
                <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-green-800 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300">
                  <FaPlus className='w-4 h-4' />
                </label>
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className={`hidden border rounded-md p-2
                  ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}
                  `}
                />
              </div>
              <p className={`text-sm
                  ${theme === 'dark' ? 'text-gray-300' : ' text-gray-500'}
                  `}>
                Choose an avatar or upload a profile picture
              </p>
              <div className={'flex flex-wrap justify-center gap-2'}>
                {avatars.map((avatar, index) => (
                  <div key={index} className={`w-12 h-12 m-2 rounded-full overflow-hidden cursor-pointer flex items-center justify-center
                    ${selectedAvatar === avatar ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}>
                    <img src={avatar} alt={`Avatar ${index + 1}`} className={`object-cover w-full h-full rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110
                    ${selectedAvatar === avatar ? 'ring-2 ring-green-500' : ''}`} />
                  </div>
                ))}
              </div>
              <div className='relative w-full flex items-center justify-center'>
                <FaUser className={`absolute left-3 top-1/2 transform -translate-y-1/2
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
                <input
                  {...profileRegister("username")}
                  type="text"
                  placeholder="Username"
                  className={`w-full p-2 border-b pl-8
                         ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'}
                         rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {profileErrors.username && (<p className='text-red-500 text-sm mt-1'>{profileErrors.username.message}</p>)}
              </div>
              <div className='flex items-center space-x-2 w-full m-2'>
                <input
                  {...profileRegister("agreed")}
                  type="checkbox"
                  name="terms"
                  checked={watch("agreed") || false} // ensures controlled boolean value
                  onChange={(e) => setValue("agreed", e.target.checked)} // sets true/false explicitly
                  id="terms" className={`ml-2 rounded
                  ${theme === 'dark' ? 'text-green-500 bg-gray-700' : 'text-green-500 bg-gray-400'}
                  focus:outline-none focus:ring-2 focus:ring-green-500`} />
                <label htmlFor="terms" className={`text-sm
                  ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  I agree to the {" "}
                  <a href="#" className={`text-red-500 hover:underline
                    ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
                    Terms and Conditions
                  </a>
                </label>
                {profileErrors.agreed && (<p className='text-red-500 text-sm mt-1'>{profileErrors.agreed.message}</p>)}
              </div>
              <button
                type='submit'
                disabled={loading}
                className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md my-2
             hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center
             ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading ? <Spinner /> : 'Create Profile'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default Login;
