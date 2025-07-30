use reqwest::{
    header::{AUTHORIZATION, CONTENT_TYPE},
    Client,
};
use serde::{Deserialize, Serialize};
use std::env;

/// Public API for the rest of the Cedar system to use.
pub async fn ask_llm(prompt: &str) -> Result<String, String> {
    let api_key = env::var("OPENAI_API_KEY").map_err(|_| "Missing OPENAI_API_KEY".to_string())?;
    call_openai(prompt, &api_key).await
}

/// Low-level OpenAI wrapper (internal only)
async fn call_openai(prompt: &str, api_key: &str) -> Result<String, String> {
    let client = Client::new();

    let request_body = OpenAIRequest {
        model: "gpt-4", // or "gpt-4o"
        messages: vec![ChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        }],
        temperature: 0.7,
    };

    let res = client
        .post("https://api.openai.com/v1/chat/completions")
        .header(CONTENT_TYPE, "application/json")
        .header(AUTHORIZATION, format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let body: OpenAIResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse LLM response: {}", e))?;

    if let Some(choice) = body.choices.first() {
        Ok(choice.message.content.clone())
    } else {
        Err("No LLM response choices returned".to_string())
    }
}

// ---------- Structs for OpenAI API ----------

#[derive(Serialize)]
struct OpenAIRequest {
    model: &'static str,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Serialize, Deserialize, Debug)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize, Debug)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Deserialize, Debug)]
struct OpenAIChoice {
    message: ChatMessage,
}
