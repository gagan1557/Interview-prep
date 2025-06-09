import axiosInstance from '../config/axios';

// Get all available job roles
export const getJobRoles = async () => {
  try {
    const response = await axiosInstance.get('/api/questions/job-roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching job roles:', error);
    throw error;
  }
};

// Get questions for a specific job role
export const getQuestionsByJobRole = async (jobRole, options = {}) => {
  try {
    const { category, difficulty, limit, seed } = options;
    
    // Build query parameters
    let queryParams = '';
    if (category) queryParams += `category=${category}&`;
    if (difficulty) queryParams += `difficulty=${difficulty}&`;
    if (limit) queryParams += `limit=${limit}&`;
    if (seed) queryParams += `seed=${seed}&`;
    
    // Remove trailing '&' if exists
    queryParams = queryParams ? `?${queryParams.slice(0, -1)}` : '';
    
    const response = await axiosInstance.get(`/api/questions/${jobRole}${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Add a new question
export const addQuestion = async (questionData) => {
  try {
    const response = await axiosInstance.post('/api/questions', questionData);
    return response.data;
  } catch (error) {
    console.error('Error adding question:', error);
    throw error;
  }
}; 