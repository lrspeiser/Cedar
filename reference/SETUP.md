# Cedar Research Assistant Setup Guide

## 🚀 Getting Started with Real Research Functionality

The Cedar app now uses the real research functionality from the `cedar-core` crate! This means you'll get actual AI-generated research plans, real Python code execution, and intelligent question generation.

## 📋 Prerequisites

1. **Python 3.x** - Required for code execution
2. **OpenAI API Key** - Required for AI-powered research features

## 🔑 Setting Up OpenAI API Key

The research functionality requires an OpenAI API key for:
- Generating research plans
- Creating intelligent questions
- Code analysis and improvement

### Step 1: Get an API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (it starts with `sk-`)

### Step 2: Configure Environment
Create a `.env` file in the project root:

```bash
# Cedar Research Assistant Environment Variables
OPENAI_API_KEY=sk-your_actual_api_key_here
```

**Important:** Never commit your `.env` file to version control!

## 🧪 Testing the Real Functionality

### Option 1: Browser Console Test
1. Start the Cedar app: `./log-capture.sh`
2. Open the browser console
3. Run the test script:
```javascript
// Copy and paste this into the browser console
const script = document.createElement('script');
script.src = '/test-real-research.js';
document.head.appendChild(script);
// Then run:
testRealResearch();
```

### Option 2: Manual Testing
1. Create a new project
2. Click "Start Research" 
3. You should see:
   - Real research plan with multiple steps
   - Actual Python code generation
   - Intelligent questions based on your goal

## 🔍 What's Different Now

### Before (Placeholder):
- Simple success messages
- No actual research planning
- No real Python execution
- Basic question templates

### After (Real Functionality):
- **AI-Generated Research Plans**: Multi-step plans tailored to your goal
- **Real Python Execution**: Actual code runs in a Python environment
- **Intelligent Questions**: Context-aware questions based on your research goal
- **Session Management**: Research state is preserved and tracked

## 🐛 Troubleshooting

### "Missing OPENAI_API_KEY" Error
- Make sure you created a `.env` file
- Verify the API key is correct
- Restart the app after adding the `.env` file

### Python Code Execution Fails
- Ensure Python 3.x is installed: `python3 --version`
- Check that required libraries are available
- The app will auto-install common data science libraries

### Research Plan is Empty
- Check your internet connection (needed for OpenAI API)
- Verify your API key has sufficient credits
- Try a more specific research goal

## 📚 Available Research Features

### Research Planning
- Goal analysis and breakdown
- Step-by-step execution plan
- Code generation for each step
- Reference suggestions

### Code Execution
- Python code execution in isolated environment
- Real-time output capture
- Error handling and debugging
- Variable extraction and tracking

### Question Generation
- Context-aware research questions
- Multiple question categories (initial, follow-up, clarification)
- Goal-specific question relevance

## 🎯 Example Research Goals

Try these research goals to test the functionality:

1. **"Analyze the relationship between temperature and humidity in weather data"**
2. **"Find patterns in customer purchase behavior from sales data"**
3. **"Compare the performance of different machine learning algorithms"**
4. **"Investigate the impact of social media usage on productivity"**

## 🔧 Advanced Configuration

### Custom OpenAI Model
Add to your `.env` file:
```
OPENAI_MODEL=gpt-4o
```

### Adjust Response Creativity
Add to your `.env` file:
```
OPENAI_TEMPERATURE=0.7
```
- Lower values (0.1-0.3): More focused, consistent responses
- Higher values (0.7-1.0): More creative, varied responses

## 📞 Support

If you encounter issues:
1. Check the logs in the `logs/` directory
2. Verify your API key and internet connection
3. Try restarting the application
4. Check the browser console for error messages

---

**Happy Researching! 🧠🔬** 