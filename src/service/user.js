import axios from "@/config/axiosConfig";


export const getCategoryList = async (lang="ar",segment_id,pageNo=1,search="") => {
  if(segment_id !== null){
    try {
      const response = await axios.get(`v1/product/category/list/?language=${lang}&page=${search?1:pageNo}&segment_id=${segment_id}&search=${search}`);
      return response.data;
    } catch (error) {
      return error?.response;
    }
  }
    
  };