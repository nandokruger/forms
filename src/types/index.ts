export interface User {
	id: string;
	email: string;
	name: string;
}

export interface Form {
	id: string;
	title: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	isPublished: boolean;
	responseCount: number;
	questions: Question[];
	workflow?: FormWorkflow;
	// UI settings
	hideFormTitle?: boolean;
	hideQuestionNumber?: boolean;
	hideProgressBar?: boolean;
	// Design settings
	design?: FormDesign;
}

export interface FormDesign {
	fontFamily?: string;
	// Colors
	titleColor?: string;
	questionColor?: string;
	buttonColor?: string;
	buttonTextColor?: string;
	// Sizes and alignment for welcome/final screens
	welcomeSize?: 'sm' | 'md' | 'lg';
	welcomeAlign?: 'left' | 'center';
	// Corners
	cornerRadius?: number;
	// Background
	backgroundColor?: string;
	backgroundImageUrl?: string;
}

export interface Question {
	id: string;
	type: QuestionType;
	title: string;
	description?: string;
	required: boolean;
	order: number;
	options?: string[];
	// For question groups
	questions?: Question[];
}

export interface QuestionGroup {
	id: string;
	title: string;
	description?: string;
	questions: Question[];
	order: number;
}

export type QuestionType =
	| 'short-text'
	| 'long-text'
	| 'multiple-choice'
	| 'email'
	| 'number'
	| 'date'
	| 'rating'
	| 'question-group'
	| 'multiquestion';

export interface Response {
	id: string;
	formId: string;
	submittedAt: string;
	answers: Answer[];
}

export interface Answer {
	questionId: string;
	value: string | string[] | number;
}

export type AppView =
	| 'login'
	| 'signup'
	| 'dashboard'
	| 'form-editor'
	| 'form-view'
	| 'results'
	| 'splash';

export interface AppState {
	currentView: AppView;
	user: User | null;
	forms: Form[];
	currentForm: Form | null;
	responses: Response[];
	isLoading: boolean;
}

// Workflow types
export interface WorkflowRule {
	id: string;
	type: 'if' | 'always';
	conditions?: Array<{
		questionId: string;
		operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
		value: string;
		logicalOperator?: 'AND' | 'OR';
	}>;
	operation?: {
		type: 'add' | 'subtract' | 'multiply' | 'divide';
		variable: 'score' | 'correct_answers' | 'max_score' | 'quiz_score' | 'total_scorable_questions';
		operand: string | number;
	};
	actions?: Array<{
		type: 'jumpTo' | 'endForm' | 'showField' | 'hideField' | 'redirect' | 'showMessage';
		targetQuestionId?: string;
		url?: string;
		message?: string;
	}>;
}

export interface FormWorkflow {
	rules: WorkflowRule[];
}
