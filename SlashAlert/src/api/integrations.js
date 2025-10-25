import apiService from '../services/apiService.js';

// Real API implementations replacing Base44 integrations
export const InvokeLLM = async ({ prompt, model, temperature = 0.7, max_tokens = 1000 }) => {
  try {
    return await apiService.invokeLLM(prompt, {
      model,
      temperature,
      max_tokens
    });
  } catch (error) {
    console.error('LLM invocation failed:', error);
    // Fallback response for graceful degradation
    return {
      response: "I'm sorry, but I couldn't process your request at the moment. Please try again later.",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      error: error.message
    };
  }
};

export const SendEmail = async ({ to, subject, body, from }) => {
  try {
    return await apiService.sendEmail({ to, subject, body, from });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const UploadFile = async ({ file }) => {
  try {
    return await apiService.uploadFile('/files/upload', file);
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export const GenerateImage = async ({ prompt, size = "1024x1024", quality = "standard" }) => {
  try {
    return await apiService.generateImage(prompt, { size, quality });
  } catch (error) {
    console.error('Image generation failed:', error);
    // Return a placeholder image as fallback
    return {
      image_url: `https://via.placeholder.com/${size.replace('x', 'x')}/0066CC/FFFFFF?text=Image+Generation+Failed`,
      revised_prompt: prompt,
      size: size,
      error: error.message
    };
  }
};

export const ExtractDataFromUploadedFile = async ({ file_url, extraction_prompt }) => {
  try {
    // If file_url is provided, use it; otherwise treat it as a file upload scenario
    if (file_url) {
      return await apiService.post('/files/extract-data', {
        file_url,
        extraction_prompt
      });
    } else {
      throw new Error('File URL is required for data extraction');
    }
  } catch (error) {
    console.error('Data extraction failed:', error);
    throw new Error(`Failed to extract data from file: ${error.message}`);
  }
};

// Receipt-specific file processing
export const ExtractProductsFromReceipt = async ({ file }) => {
  try {
    // First upload the file
    const uploadResult = await UploadFile({ file });
    
    // Then extract product data from the uploaded file
    return await apiService.extractProductsFromReceipt(uploadResult.file_id);
  } catch (error) {
    console.error('Receipt processing failed:', error);
    throw new Error(`Failed to process receipt: ${error.message}`);
  }
};

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  ExtractProductsFromReceipt
};






