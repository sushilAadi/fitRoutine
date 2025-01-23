import axios from 'axios';

const exerciseApi = axios.create({
  baseURL: 'https://exercisedb.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': 'aebaebb54bmsh761b33cf18841f8p1076b5jsnf8882084481b',
    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
  }
});

const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response received from the server');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(`Error setting up the request: ${error.message}`);
  }
};

export const getExercises = async () => {
  try {
    const response = await exerciseApi.get('/exercises?limit=0&offset=0');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
export const getExercisesGif = async (id="0001") => {
  try {
    const response = await exerciseApi.get(`/exercises/exercise/${id}`);
    return response.data.gifUrl;
  } catch (error) {
    handleApiError(error);
  }
};

export const getExercisesByName = async (name, limit = 800, offset = 0) => {
  try {
    const response = await exerciseApi.get(`/exercises/name/${name}?offset=${offset}&limit=${limit}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getExercisesByBodyPart = async (bodyPart, limit = 1000) => {
  try {
    const response = await exerciseApi.get(`/exercises/bodyPart/${bodyPart}?limit=${limit}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getBodyPartList = async () => {
  try {
    const response = await exerciseApi.get('/exercises/bodyPartList');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getEquipmentList = async () => {
  try {
    const response = await exerciseApi.get('/exercises/equipmentList');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};



export const getExercisesByEquipment = async (equipment, limit = 10, offset = 0) => {
  try {
    const response = await exerciseApi.get(`/exercises/equipment/${equipment}?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getTargetList = async () => {
  try {
    const response = await exerciseApi.get('/exercises/targetList');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getExercisesByTarget = async (target, limit = 10, offset = 0) => {
  try {
    const response = await exerciseApi.get(`/exercises/target/${target}?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getExerciseById = async (id) => {
  try {
    const response = await exerciseApi.get(`/exercises/exercise/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};



