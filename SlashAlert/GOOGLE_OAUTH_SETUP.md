# Google OAuth Setup Instructions

## Setting up Google SSO for SlashAlert

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Identity API

### 2. Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Set the application type to **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)

### 3. Configure Environment Variables

1. Copy your Client ID from the Google Cloud Console
2. Update the `.env` file in your project root:
   ```
   VITE_GOOGLE_CLIENT_ID=your-actual-client-id-here
   ```

### 4. Test the Integration

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click the "Sign in with Google" button
4. Complete the OAuth flow
5. You should be redirected to the Dashboard upon successful authentication

## Security Notes

- Never commit your actual Client ID to version control if it's sensitive
- Consider using different Client IDs for development and production
- The Google Identity Services library handles secure token management
- User data is stored locally in localStorage for session persistence

## Troubleshooting

- **"Unauthorized"**: Check that your domain is listed in authorized origins
- **Button not appearing**: Verify the Client ID is correctly set in `.env`
- **Redirect issues**: Ensure authorized redirect URIs match your domain exactly