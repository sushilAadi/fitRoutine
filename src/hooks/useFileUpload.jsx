export const useFileUpload = (allowedTypes, maxSizeInMB, options = { single: true, multiple: false, append: true }) => {
    const [fileData, setFileData] = useState(options.multiple ? [] : {
      base64Data: null,
      fileType: null,
      errorMessage: null,
      id:uuidv4()
    });
  
    const handleFileUpload = (files) => {
      if (!files || files.length === 0) {
        setFileData(options.multiple ? [] : {
          base64Data: null,
          fileType: null,
          errorMessage: 'No file selected.',
          id:uuidv4()
        });
        return;
      }
  
      if (!options.multiple && options.single && files.length > 1) {
        setFileData({
          base64Data: null,
          fileType: null,
          errorMessage: 'Only single file upload allowed.',
          id:uuidv4()
        });
        return;
      }
  
      const processedFiles = [];
  
      for (const file of files) {
        // Check if the file type is allowed
        if (!allowedTypes.includes(file.type)) {
          processedFiles.push({
            base64Data: null,
            fileType: null,
            errorMessage: 'Invalid file type. Please upload only allowed types.',
            id:uuidv4()
          });
          continue;
        }
  
        // Check if the file size is within the limit
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          processedFiles.push({
            base64Data: null,
            fileType: null,
            errorMessage: `File size exceeds the limit of ${maxSizeInMB}MB.`,
            id:uuidv4()
          });
          continue;
        }
  
        // Read the file as base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result;
          processedFiles.push({
            base64Data,
            fileType: file.type,
            errorMessage: null,
            id:uuidv4()
          });
  
          if (options.multiple) {
            setFileData([...fileData, ...processedFiles]);
          } else {
            setFileData(processedFiles[0]);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    const handleFileDelete = (id) => {
      if (options.multiple) {
        const updatedFiles = fileData.filter((file) => file.id !== id);
        setFileData(updatedFiles);
      } else {
        setFileData({
          base64Data: null,
          fileType: null,
          errorMessage: null,
          id: uuidv4(),
        });
      }
    };
    const resetFileData = () => {
      setFileData(options.multiple ? [] : {
        base64Data: null,
        fileType: null,
        errorMessage: null,
        id:uuidv4()
      });
    };
  
    return { handleFileUpload,handleFileDelete,resetFileData, fileData };
  };