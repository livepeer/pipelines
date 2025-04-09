# Daydream Chat Interface

This component provides a chat interface for the Daydream Prompting System, allowing users to interact with the system through natural language.

## Components

- `ChatContainer`: The main container component that manages the chat state and integrates all components
- `ChatForm`: The input form with text and image upload capabilities
- `ChatMessage`: Displays individual messages with suggestions and feedback
- `AutoResizeTextarea`: A custom textarea component that automatically adjusts its height

## Integration with Dreamshaper

The chat interface is integrated with the Dreamshaper component, allowing users to:

1. Enter text descriptions of what they want to visualize
2. Upload reference images
3. Receive suggestions for variations
4. Provide feedback on the generated visualizations

## API Integration

The chat interface uses the `handleStreamUpdate` hook from the `useDreamshaper` hook to update the stream with the user's prompts. This ensures that the chat interface is fully integrated with the existing Dreamshaper functionality.

## Environment Variables

The chat interface requires the following environment variable:

- `OPENAI_API_KEY`: Your OpenAI API key for generating optimized prompts

## Usage

The chat interface is automatically included in the Dreamshaper component. Users can interact with it by:

1. Typing a description of what they want to visualize
2. Optionally uploading a reference image
3. Submitting the prompt
4. Viewing the generated visualization
5. Providing feedback or selecting suggestions for variations

## Styling

The chat interface uses Tailwind CSS for styling and is designed to be responsive and user-friendly. 