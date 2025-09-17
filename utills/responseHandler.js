

const Response = (res, statusCode, message, data = null,payload = {}) => {
    if(!res){
        console.error("Response object is not defined");
        return
    }
    
    const responseObject = {
        status: statusCode < 400 ? 'success' : 'error',
        message,
        data,
        payload
    };
    return res.status(statusCode).json(responseObject);
}

export default Response;
