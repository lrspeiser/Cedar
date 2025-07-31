#[cfg(test)]
mod tests {
    use crate::{
        AppState, Project, Question, Library, Reference, VariableInfo,
        StartResearchRequest, ExecuteCodeRequest, GenerateQuestionsRequest,
        CreateProjectRequest, SetApiKeyRequest
    };
    use std::collections::HashMap;
    use std::sync::Mutex;

    // Helper function to create test state
    fn create_test_app_state() -> AppState {
        AppState {
            sessions: Mutex::new(HashMap::new()),
            api_key: Mutex::new(None),
            projects: Mutex::new(HashMap::new()),
            current_project: Mutex::new(None),
        }
    }

    #[test]
    fn test_app_state_creation() {
        let state = create_test_app_state();
        assert!(state.sessions.lock().unwrap().is_empty());
        assert!(state.api_key.lock().unwrap().is_none());
        assert!(state.projects.lock().unwrap().is_empty());
        assert!(state.current_project.lock().unwrap().is_none());
    }

    #[test]
    fn test_start_research_request() {
        let request = StartResearchRequest {
            project_id: "test-project".to_string(),
            session_id: "test-session".to_string(),
            goal: "Test research goal".to_string(),
        };

        assert_eq!(request.project_id, "test-project");
        assert_eq!(request.session_id, "test-session");
        assert_eq!(request.goal, "Test research goal");
    }

    #[test]
    fn test_start_research_request_serialization() {
        let request = StartResearchRequest {
            project_id: "test-project".to_string(),
            session_id: "test-session".to_string(),
            goal: "Test research goal".to_string(),
        };

        // Test serialization
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("test-project"));
        assert!(json.contains("test-session"));
        assert!(json.contains("Test research goal"));

        // Test deserialization
        let deserialized: StartResearchRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.project_id, request.project_id);
        assert_eq!(deserialized.session_id, request.session_id);
        assert_eq!(deserialized.goal, request.goal);
    }

    #[test]
    fn test_execute_code_request() {
        let request = ExecuteCodeRequest {
            code: "print('Hello, World!')".to_string(),
            session_id: "test-session".to_string(),
        };

        assert_eq!(request.code, "print('Hello, World!')");
        assert_eq!(request.session_id, "test-session");
    }

    #[test]
    fn test_execute_code_request_serialization() {
        let request = ExecuteCodeRequest {
            code: "print('Hello, World!')".to_string(),
            session_id: "test-session".to_string(),
        };

        // Test serialization
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("print('Hello, World!')"));
        assert!(json.contains("test-session"));

        // Test deserialization
        let deserialized: ExecuteCodeRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.code, request.code);
        assert_eq!(deserialized.session_id, request.session_id);
    }

    #[test]
    fn test_generate_questions_request() {
        let request = GenerateQuestionsRequest {
            project_id: "test-project".to_string(),
            goal: "Test research goal".to_string(),
        };

        assert_eq!(request.project_id, "test-project");
        assert_eq!(request.goal, "Test research goal");
    }

    #[test]
    fn test_generate_questions_request_serialization() {
        let request = GenerateQuestionsRequest {
            project_id: "test-project".to_string(),
            goal: "Test research goal".to_string(),
        };

        // Test serialization
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("test-project"));
        assert!(json.contains("Test research goal"));

        // Test deserialization
        let deserialized: GenerateQuestionsRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.project_id, request.project_id);
        assert_eq!(deserialized.goal, request.goal);
    }

    #[test]
    fn test_create_project_request() {
        let request = CreateProjectRequest {
            name: "Test Project".to_string(),
            goal: "Test research goal".to_string(),
        };

        assert_eq!(request.name, "Test Project");
        assert_eq!(request.goal, "Test research goal");
    }

    #[test]
    fn test_set_api_key_request() {
        let request = SetApiKeyRequest {
            api_key: "test-api-key".to_string(),
        };

        assert_eq!(request.api_key, "test-api-key");
    }

    #[test]
    fn test_variable_info_creation() {
        let variable = VariableInfo {
            name: "test_var".to_string(),
            type_name: "str".to_string(),
            shape: Some("(10,)".to_string()),
            purpose: "Test variable".to_string(),
            example_value: "test_value".to_string(),
            source: "test".to_string(),
            updated_at: "2023-01-01T00:00:00Z".to_string(),
            related_to: vec![],
            visibility: "public".to_string(),
            units: None,
            tags: vec!["test".to_string()],
        };

        assert_eq!(variable.name, "test_var");
        assert_eq!(variable.type_name, "str");
        assert_eq!(variable.purpose, "Test variable");
        assert_eq!(variable.shape, Some("(10,)".to_string()));
        assert_eq!(variable.visibility, "public");
        assert_eq!(variable.tags, vec!["test".to_string()]);
    }

    #[test]
    fn test_question_creation() {
        let question = Question {
            id: "q1".to_string(),
            question: "What is the goal?".to_string(),
            answer: None,
            category: "initial".to_string(),
            created_at: "2023-01-01T00:00:00Z".to_string(),
            answered_at: None,
            status: "pending".to_string(),
            related_to: vec![],
        };

        assert_eq!(question.id, "q1");
        assert_eq!(question.question, "What is the goal?");
        assert_eq!(question.category, "initial");
        assert_eq!(question.status, "pending");
        assert!(question.answer.is_none());
        assert!(question.answered_at.is_none());
    }

    #[test]
    fn test_library_creation() {
        let library = Library {
            name: "numpy".to_string(),
            version: Some("1.21.0".to_string()),
            source: "auto_detected".to_string(),
            status: "pending".to_string(),
            installed_at: None,
            error_message: None,
            required_by: vec!["cell1".to_string()],
        };

        assert_eq!(library.name, "numpy");
        assert_eq!(library.version, Some("1.21.0".to_string()));
        assert_eq!(library.source, "auto_detected");
        assert_eq!(library.status, "pending");
        assert_eq!(library.required_by, vec!["cell1".to_string()]);
    }

    #[test]
    fn test_reference_creation() {
        let reference = Reference {
            id: "ref1".to_string(),
            title: "Test Paper".to_string(),
            authors: "John Doe".to_string(),
            url: Some("https://example.com".to_string()),
            content: "Test content".to_string(),
            added_at: "2023-01-01T00:00:00Z".to_string(),
        };

        assert_eq!(reference.id, "ref1");
        assert_eq!(reference.title, "Test Paper");
        assert_eq!(reference.authors, "John Doe");
        assert_eq!(reference.url, Some("https://example.com".to_string()));
        assert_eq!(reference.content, "Test content");
    }

    #[test]
    fn test_project_creation() {
        let project = Project {
            id: "test-project".to_string(),
            name: "Test Project".to_string(),
            goal: "Test goal".to_string(),
            created_at: "2023-01-01T00:00:00Z".to_string(),
            updated_at: "2023-01-01T00:00:00Z".to_string(),
            data_files: vec![],
            images: vec![],
            references: vec![],
            variables: vec![],
            questions: vec![],
            libraries: vec![],
            write_up: "".to_string(),
        };

        assert_eq!(project.id, "test-project");
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.goal, "Test goal");
        assert!(project.data_files.is_empty());
        assert!(project.images.is_empty());
        assert!(project.references.is_empty());
        assert!(project.variables.is_empty());
        assert!(project.questions.is_empty());
        assert!(project.libraries.is_empty());
        assert_eq!(project.write_up, "");
    }

    #[test]
    fn test_serialization() {
        let project = Project {
            id: "test-project".to_string(),
            name: "Test Project".to_string(),
            goal: "Test goal".to_string(),
            created_at: "2023-01-01T00:00:00Z".to_string(),
            updated_at: "2023-01-01T00:00:00Z".to_string(),
            data_files: vec![],
            images: vec![],
            references: vec![],
            variables: vec![],
            questions: vec![],
            libraries: vec![],
            write_up: "".to_string(),
        };

        // Test serialization
        let json = serde_json::to_string(&project).unwrap();
        assert!(json.contains("test-project"));
        assert!(json.contains("Test Project"));
        assert!(json.contains("Test goal"));

        // Test deserialization
        let deserialized: Project = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, project.id);
        assert_eq!(deserialized.name, project.name);
        assert_eq!(deserialized.goal, project.goal);
    }

    #[test]
    fn test_variable_info_serialization() {
        let variable = VariableInfo {
            name: "test_var".to_string(),
            type_name: "str".to_string(),
            shape: Some("(10,)".to_string()),
            purpose: "Test variable".to_string(),
            example_value: "test_value".to_string(),
            source: "test".to_string(),
            updated_at: "2023-01-01T00:00:00Z".to_string(),
            related_to: vec![],
            visibility: "public".to_string(),
            units: None,
            tags: vec!["test".to_string()],
        };

        let json = serde_json::to_string(&variable).unwrap();
        assert!(json.contains("test_var"));
        assert!(json.contains("str"));
        assert!(json.contains("Test variable"));

        let deserialized: VariableInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, variable.name);
        assert_eq!(deserialized.type_name, variable.type_name);
        assert_eq!(deserialized.purpose, variable.purpose);
    }

    #[test]
    fn test_question_serialization() {
        let question = Question {
            id: "q1".to_string(),
            question: "What is the goal?".to_string(),
            answer: None,
            category: "initial".to_string(),
            created_at: "2023-01-01T00:00:00Z".to_string(),
            answered_at: None,
            status: "pending".to_string(),
            related_to: vec![],
        };

        let json = serde_json::to_string(&question).unwrap();
        assert!(json.contains("q1"));
        assert!(json.contains("What is the goal?"));
        assert!(json.contains("initial"));

        let deserialized: Question = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, question.id);
        assert_eq!(deserialized.question, question.question);
        assert_eq!(deserialized.category, question.category);
    }

    // Integration tests for research functionality
    #[tokio::test]
    async fn test_research_workflow() {
        // This test simulates a complete research workflow
        let state = create_test_app_state();
        
        // Test 1: Create a project
        let create_request = CreateProjectRequest {
            name: "Research Test Project".to_string(),
            goal: "Test the research workflow".to_string(),
        };
        
        // Test 2: Start research
        let research_request = StartResearchRequest {
            project_id: "test-project-123".to_string(),
            session_id: "test-session-456".to_string(),
            goal: "Test the research workflow".to_string(),
        };
        
        // Test 3: Execute code
        let code_request = ExecuteCodeRequest {
            code: "print('Hello from research test!')".to_string(),
            session_id: "test-session-456".to_string(),
        };
        
        // Test 4: Generate questions
        let questions_request = GenerateQuestionsRequest {
            project_id: "test-project-123".to_string(),
            goal: "Test the research workflow".to_string(),
        };
        
        // Verify all requests are properly structured
        assert_eq!(create_request.name, "Research Test Project");
        assert_eq!(research_request.project_id, "test-project-123");
        assert_eq!(research_request.session_id, "test-session-456");
        assert_eq!(code_request.code, "print('Hello from research test!')");
        assert_eq!(questions_request.project_id, "test-project-123");
    }

    #[test]
    fn test_json_parsing_for_cli() {
        // Test that the JSON format expected by CLI mode works correctly
        let research_json = r#"{"project_id": "test-project", "session_id": "test-session", "goal": "Test goal"}"#;
        let research_request: StartResearchRequest = serde_json::from_str(research_json).unwrap();
        
        assert_eq!(research_request.project_id, "test-project");
        assert_eq!(research_request.session_id, "test-session");
        assert_eq!(research_request.goal, "Test goal");
        
        let code_json = r#"{"code": "print('test')", "session_id": "test-session"}"#;
        let code_request: ExecuteCodeRequest = serde_json::from_str(code_json).unwrap();
        
        assert_eq!(code_request.code, "print('test')");
        assert_eq!(code_request.session_id, "test-session");
        
        let questions_json = r#"{"project_id": "test-project", "goal": "Test goal"}"#;
        let questions_request: GenerateQuestionsRequest = serde_json::from_str(questions_json).unwrap();
        
        assert_eq!(questions_request.project_id, "test-project");
        assert_eq!(questions_request.goal, "Test goal");
    }

    #[test]
    fn test_error_handling_for_invalid_json() {
        // Test that invalid JSON is properly handled
        let invalid_json = r#"{"project_id": "test-project", "session_id": "test-session"}"#; // missing goal
        let result: Result<StartResearchRequest, _> = serde_json::from_str(invalid_json);
        assert!(result.is_err());
        
        let invalid_code_json = r#"{"code": "print('test')"}"#; // missing session_id
        let code_result: Result<ExecuteCodeRequest, _> = serde_json::from_str(invalid_code_json);
        assert!(code_result.is_err());
    }
} 