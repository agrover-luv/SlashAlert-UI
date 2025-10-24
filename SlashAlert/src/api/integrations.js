import * as mocks from './mockIntegrations.js';

// Use local mock implementations instead of Base44 API calls
export const Core = mocks.Core;
export const InvokeLLM = mocks.InvokeLLM;
export const SendEmail = mocks.SendEmail;
export const UploadFile = mocks.UploadFile;
export const GenerateImage = mocks.GenerateImage;
export const ExtractDataFromUploadedFile = mocks.ExtractDataFromUploadedFile;






