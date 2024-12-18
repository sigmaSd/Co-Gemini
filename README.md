# Co-Gemini

To listen to the audio right click on this video and open it in a new tab (seems like a github limitation)
[demo.webm](https://github.com/user-attachments/assets/9d6a086c-2946-4204-a18f-97e8e89b0a66)

A voice-enabled AI copilot powered by Google's Gemini that can control your Linux desktop through natural language commands. Acts as your personal desktop assistant with both voice and text interfaces.

## Features

- 🎤 Voice commands and text-to-speech responses
- 💻 Control terminal and applications
- 📷 Screenshot analysis
- 📋 Clipboard integration
- 🔍 Web search capabilities
- ⌨️ Keyboard simulation
- 🪟 Window management
- 📢 System notifications

## Prerequisites

### API Key
You'll need a Google AI API key from https://aistudio.google.com/apikey
The API is free to use with generous quotas.

### Required Software
- Deno (for running the application)
- xdotool (for keyboard/window control)
- xclip (for clipboard operations)
- flameshot (for screenshots)
- notify-send (for system notifications)
- A modern web browser with WebSpeech API support (Chrome recommended)
- Xorg is needed for xdotool commands, the rest of the commands work on wayland

Install on Fedora:
```bash
sudo dnf install xdotool xclip flameshot libnotify
```

On Ubuntu/Debian:
```bash
sudo apt install xdotool xclip flameshot libnotify-bin
```

## Usage

0. Set up your API key:
```bash
export API_KEY="your-google-api-key"
```

1. Start the server:
```bash
# Run with no setup
deno run --reload -A https://raw.githubusercontent.com/sigmaSd/Co-Gemini/refs/heads/master/main.ts
# Otherwise you can just clone the repo and run main.ts
```

2. Open http://localhost:8000 in your browser for voice interface

3. Use the command line interface directly in the terminal

4. Global Voice Activation Setup:
   - Include the `triggerListen.sh` script in your keyboard shortcuts for system-wide voice command access:
     1. Make the script executable: `chmod +x triggerListen.sh`
     2. Go to your desktop environment's keyboard settings
     3. Add a new custom shortcut (e.g., Ctrl+Alt+V)
     4. Set the command to the full path of triggerListen.sh

   ⚠️ Chrome Audio Requirement:
   - Chrome requires a user interaction (button click) to enable audio processing:
     1. Open http://localhost:8000 in Chrome
     2. Click "Start Listening" once to initialize the audio system
     3. This is not about permissions - Chrome needs one manual interaction per session
     4. After clicking once, the keyboard shortcut will work until you close Chrome

   Now you can trigger voice commands from anywhere using your keyboard shortcut!

### Available Commands

- `[terminal]`: Opens a new terminal window
- `[appName] (name)`: Launches a specific application
- `[text] (text)`: Sends text input to the active window
- `[screenShot]`: Captures a screenshot for analysis
- `[clipBoard]`: Reads the current clipboard content
- `[notify] (message)`: Sends a system notification
- `[search] (query)`: Opens browser with search query
- `[file] (path)`: Opens file with default app
- `[keyPress] (keys)`: Simulates keyboard input
- `[window] (action)`: Controls windows (maximize/minimize/close)
- `[listen]`: Listens for voice input

## Future Improvements

- Video stream support is possible but currently not implemented to avoid high bandwidth usage
- Support other systems
- Make the commands extendable, maybe by exporting the needed part as a library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
```

The new title "Co-Gemini" better reflects the application's role as a Gemini-powered copilot for desktop interactions. I've also slightly modified the introduction to emphasize this aspect.
