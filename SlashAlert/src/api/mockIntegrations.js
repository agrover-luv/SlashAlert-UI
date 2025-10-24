// Mock implementations for Base44 integrations to replace API calls with local functionality

export const InvokeLLM = async ({ prompt, model, temperature = 0.7, max_tokens = 1000 }) => {
  // Mock LLM response - returns a simulated response based on the prompt
  console.log('Mock LLM invoked with prompt:', prompt);
  
  // Simulate different responses based on prompt content
  if (prompt.includes('product') && prompt.includes('category')) {
    return {
      response: "electronics",
      usage: { prompt_tokens: 50, completion_tokens: 10, total_tokens: 60 }
    };
  }
  
  if (prompt.includes('price') && prompt.includes('comparison')) {
    return {
      response: "The current price appears to be competitive compared to similar products in the market.",
      usage: { prompt_tokens: 100, completion_tokens: 25, total_tokens: 125 }
    };
  }
  
  if (prompt.includes('product') && prompt.includes('description')) {
    return {
      response: "This is a high-quality product suitable for everyday use.",
      usage: { prompt_tokens: 75, completion_tokens: 15, total_tokens: 90 }
    };
  }
  
  return {
    response: "This is a mock response from the LLM integration.",
    usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
  };
};

export const SendEmail = async ({ to, subject, body, from }) => {
  // Mock email sending - logs the email details instead of actually sending
  console.log('Mock email sent:', { to, subject, body, from });
  
  return {
    success: true,
    message_id: `mock_email_${Date.now()}`,
    status: 'queued'
  };
};

export const UploadFile = async ({ file }) => {
  // Mock file upload - returns a fake URL
  console.log('Mock file upload:', file.name);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    file_url: `https://mock-storage.example.com/uploads/${Date.now()}_${file.name}`,
    file_id: `file_${Date.now()}`,
    size: file.size,
    type: file.type
  };
};

export const GenerateImage = async ({ prompt, size = "1024x1024", quality = "standard" }) => {
  // Mock image generation - returns a placeholder image URL
  console.log('Mock image generation for prompt:', prompt);
  
  // Simulate generation delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    image_url: `https://via.placeholder.com/${size.replace('x', 'x')}/0066CC/FFFFFF?text=Generated+Image`,
    revised_prompt: prompt,
    size: size
  };
};

export const ExtractDataFromUploadedFile = async ({ file_url, extraction_prompt }) => {
  // Mock data extraction from uploaded files
  console.log('Mock data extraction from:', file_url);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock extracted product data
  return {
    extracted_data: {
      products: [
        {
          name: "Mock Extracted Product",
          price: 29.99,
          retailer: "Mock Store",
          category: "electronics",
          description: "This is a mock product extracted from the uploaded receipt"
        }
      ],
      total_amount: 29.99,
      date: new Date().toISOString(),
      store_name: "Mock Store"
    },
    confidence: 0.85
  };
};

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile
};

export default {
  Core
};