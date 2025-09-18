import React from 'react';
import { Phone, Mail, MessageCircle, Users, Shield, Zap } from 'lucide-react';
import whatsappImage from '../utils/images/whatsapp_image.png';
import ThemeBox from './Theme/ThemeBox';
import useThemeStore from '../store/themeStore';

const Home = () => {
  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-green-500" />,
      title: "Instant Messaging",
      description: "Send and receive messages instantly with real-time chat"
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Group Chats",
      description: "Create and manage group conversations with friends and family"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "End-to-End Encryption",
      description: "Your conversations are secure and private"
    },
    {
      icon: <Zap className="w-8 h-8 text-green-500" />,
      title: "Fast & Reliable",
      description: "Lightning-fast messaging with reliable delivery"
    }
  ];
const {theme } = useThemeStore()
  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 ${(theme === 'light') ?  'via-white to-green-100' : 'via-black to-green-600'}`}>
      <ThemeBox />
      {/* Navigation */}
      <nav className={`${(theme === 'light') ? 'bg-white text-gray-800' : 'bg-gray-800 text-gray-200'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src={whatsappImage} alt="WhatsApp" className="h-10 w-10" />
              <span className="text-2xl font-bold text-green-600">ChatSphere </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/" className="text-green-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <a href="/user-login" className={`${(theme === 'dark') ? 'text-gray-400 hover:text-green-300':'text-gray-700 hover:text-green-600'} px-3 py-2 rounded-md text-sm font-medium`}>Login</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className={`relative z-10 pb-8 ${(theme === 'dark') ? 'text-gray-200':' text-gray-800'} sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32`}>
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className={`text-4xl tracking-tight font-extrabold ${(theme === 'dark') ? 'text-gray-200' : 'text-gray-900'} sm:text-5xl md:text-6xl`}>
                  <span className="block">Connect with</span>
                  <span className="block text-green-600">ChatSphere </span>
                </h1>
                <p className={`mt-3 text-base ${(theme === 'dark') ? 'text-gray-200': 'text-gray-500'} sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0`}>
                  Experience seamless messaging with our ChatSphere . Chat, share, and stay connected with friends and family across the globe.
                </p>
                
                {/* CTA Buttons */}
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a
                      href="/user-login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium 
                      rounded-md text-white bg-green-600 hover:bg-green-700 
                      md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
                    >
                      Get Started
                    </a>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="#features"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
                    >
                      Learn More
                    </a>
                  </div>
                </div>

                {/* Registration Options */}
                <div className="mt-8">
                  <p className="text-sm text-gray-600 mb-4">Register with:</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150">
                      <Phone className="w-5 h-5 mr-2 text-green-600" />
                      Phone Number
                    </button>
                    <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150">
                      <Mail className="w-5 h-5 mr-2 text-green-600" />
                      Email Address
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur-3xl opacity-20"></div>
              <img
                className="relative mx-auto w-96 h-96 object-contain"
                src={whatsappImage}
                alt="ChatSphere "
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className={`py-12 ${(theme === 'light') ? 'bg-white text-gray-800':'bg-transparent text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={`text-3xl font-extrabold ${(theme === 'dark') ? 'text-gray-200' :'text-gray-900'} sm:text-4xl`}>
              Why Choose ChatSphere ?
            </h2>
            <p className={`mt-4 text-lg ${(theme === 'dark') ? 'text-gray-300':'text-gray-500'}`}>
              Experience the best messaging features in one place
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="pt-6">
                  <div className={`flow-root ${(theme === 'light') ? 'bg-gray-50':'bg-transparent'} rounded-lg px-6 pb-8 h-full hover:shadow-lg transition duration-300`}>
                    <div className="-mt-6">
                      <div>
                        <span className={`inline-flex items-center justify-center p-3 ${(theme === 'light') ? 'bg-white text-gray-800':'bg-transparent text-white'} rounded-md shadow-lg`}>
                          {feature.icon}
                        </span>
                      </div>
                      <h3 className={`mt-8 text-lg font-medium ${(theme === 'dark') ? 'text-gray-300':' text-gray-900'} tracking-tight`}>
                        {feature.title}
                      </h3>
                      <p className={`mt-5 text-base ${(theme === 'dark') ? 'text-gray-300':'text-gray-500'}`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`${(theme === 'light') ? 'bg-gray-200 text-black': 'bg-gray-900 text-white'}`}>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base">
              &copy; 2024 ChatSphere . Built with ❤️ for seamless communication.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
