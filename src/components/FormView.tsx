import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, PlayCircle, Check } from 'lucide-react';
import { Form, Answer, Response, WorkflowRule, FinalScreen } from '../types';
import { generateId, validateEmail, validateRequired } from '../utils/helpers';

interface FormViewProps {
	form: Form;
	onSubmit: (response: Response) => void;
	onBack?: () => void;
}

const scopeCss = (css: string, scope: string): string => {
	if (!css) return '';
	try {
		// This is a basic implementation. For a production app, a proper CSS parser/scoper would be safer.
		// It splits by blocks, then prefixes selectors.
		return css.replace(/([^{}]+)({[^{}]+})/g, (_match, selectors, body) => {
			if (selectors.trim().startsWith('@')) {
				// Don't scope @-rules like @keyframes, @media, etc.
				return `${selectors}${body}`;
			}
			const scopedSelectors = selectors.split(',').map((selector) => `${scope} ${selector.trim()}`);
			return `${scopedSelectors.join(', ')} ${body}`;
		});
	} catch (e) {
		console.error('Could not scope CSS, using original. Error:', e);
		return css; // Return original on error
	}
};

export const FormView: React.FC<FormViewProps> = ({ form, onSubmit, onBack }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(form.welcomeScreen ? -1 : 0); // -1 para tela de início
	const [currentGroupQuestionIndex, setCurrentGroupQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [isCompleted, setIsCompleted] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [showFinal, setShowFinal] = useState<FinalScreen | null>(null);
	const [customCss, setCustomCss] = useState('');

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const css = params.get('customCss');
		if (css) {
			setCustomCss(decodeURIComponent(css));
		}
	}, []);

	const customCssStyle = customCss
		? React.createElement('style', {
				dangerouslySetInnerHTML: { __html: scopeCss(customCss, '#op-form-container') },
		  })
		: null;

	const hasWelcomeScreen = !!form.welcomeScreen;
	const isShowingWelcome = hasWelcomeScreen && currentQuestionIndex === -1;

	const currentQuestion = form.questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === form.questions.length - 1;

	// Check if current question is a group or multiquestion
	const isCurrentQuestionGroup = currentQuestion?.type === 'question-group';
	const isCurrentQuestionMulti = currentQuestion?.type === 'multiquestion';
	const groupQuestions =
		isCurrentQuestionGroup || isCurrentQuestionMulti ? currentQuestion.questions || [] : [];
	const currentGroupQuestion =
		isCurrentQuestionGroup || isCurrentQuestionMulti
			? groupQuestions[currentGroupQuestionIndex]
			: null;
	const isLastGroupQuestion =
		isCurrentQuestionGroup || isCurrentQuestionMulti
			? currentGroupQuestionIndex === groupQuestions.length - 1
			: true;

	// Calculate progress - for groups and multiquestion, we need to count all questions
	const totalQuestions = form.questions.reduce((total, q) => {
		if (q.type === 'question-group' || q.type === 'multiquestion') {
			return total + (q.questions?.length || 0);
		}
		return total + 1;
	}, 0);

	const currentProgress =
		currentQuestionIndex < 0
			? 0
			: form.questions.slice(0, currentQuestionIndex).reduce((total, q) => {
					if (q.type === 'question-group' || q.type === 'multiquestion') {
						return total + (q.questions?.length || 0);
					}
					return total + 1;
			  }, 0) +
			  (isCurrentQuestionGroup || isCurrentQuestionMulti ? currentGroupQuestionIndex + 1 : 1);

	const progress = (currentProgress / totalQuestions) * 100;

	// Styles (computed early so they are available for all branches)
	const pageStyle: React.CSSProperties = {
		fontFamily: form.design?.fontFamily || undefined,
		backgroundColor: form.design?.backgroundColor || undefined,
		backgroundImage: form.design?.backgroundImageUrl
			? `url(${form.design.backgroundImageUrl})`
			: undefined,
		backgroundSize: form.design?.backgroundImageUrl ? 'cover' : undefined,
		backgroundPosition: form.design?.backgroundImageUrl ? 'center' : undefined,
	};

	const titleStyle: React.CSSProperties = { color: form.design?.titleColor || undefined };
	const questionTextStyle: React.CSSProperties = { color: form.design?.questionColor || undefined };
	const hasCustomButton = Boolean(
		form.design?.buttonColor ||
			form.design?.buttonTextColor ||
			form.design?.cornerRadius !== undefined
	);
	const baseButtonClass = `inline-flex items-center px-8 py-3 text-base font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-lg`;
	const defaultButtonClasses = `bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
	const buttonClass = `${baseButtonClass} ${hasCustomButton ? '' : defaultButtonClasses}`.trim();
	const primaryButtonStyle: React.CSSProperties = {
		backgroundColor: form.design?.buttonColor || undefined,
		color: form.design?.buttonTextColor || undefined,
		borderRadius:
			form.design?.cornerRadius !== undefined ? `${form.design.cornerRadius}px` : undefined,
	};
	const useCustomBg = Boolean(form.design?.backgroundColor || form.design?.backgroundImageUrl);

	const findQuestionIndexById = (questionId: string | undefined): number => {
		if (!questionId) return -1;
		return form.questions.findIndex((q) => q.id === questionId);
	};

	const evaluateIfRule = (rule: WorkflowRule): boolean => {
		if (!rule.conditions || rule.conditions.length === 0) return false;
		// Evaluate left-to-right with logicalOperator on each condition (from second onwards)
		let result = false;
		rule.conditions.forEach((cond, idx) => {
			const value = String(answers[cond.questionId] ?? '');
			const target = String(cond.value ?? '');
			let cmp = false;
			switch (cond.operator) {
				case 'equals':
					cmp = value === target;
					break;
				case 'not_equals':
					cmp = value !== target;
					break;
				case 'contains':
					cmp = value.includes(target);
					break;
				case 'not_contains':
					cmp = !value.includes(target);
					break;
				case 'greater_than':
					cmp = Number(value) > Number(target);
					break;
				case 'less_than':
					cmp = Number(value) < Number(target);
					break;
				default:
					cmp = false;
			}
			if (idx === 0) {
				result = cmp;
			} else {
				const op = cond.logicalOperator || 'AND';
				result = op === 'AND' ? result && cmp : result || cmp;
			}
		});
		return result;
	};

	const computeNextIndexFromWorkflow = (): number | 'end' | 'final' | string | null => {
		const rules = form.workflow?.rules || [];
		for (const rule of rules) {
			if (rule.type === 'if') {
				if (!evaluateIfRule(rule)) continue;
			}
			// Actions processing
			if (rule.actions && rule.actions.length > 0) {
				for (const action of rule.actions) {
					if (action.type === 'jumpTo') {
						if (action.targetQuestionId === 'end_form') return 'final';
						// Allow jump to a final by id
						const finalExists = (form.finals || []).some((f) => f.id === action.targetQuestionId);
						if (finalExists) return action.targetQuestionId!;
						const idx = findQuestionIndexById(action.targetQuestionId);
						if (idx >= 0) return idx;
					}
					if (action.type === 'endForm') return 'final';
					// showMessage and others are non-navigational here
				}
			}
			// If rule type is 'always' and no actionable navigation, continue
		}
		return null; // no rule matched
	};

	const validateCurrentAnswer = () => {
		if (!currentQuestion) return true;

		// For multiquestion, validate all questions in the group
		if (isCurrentQuestionMulti) {
			const questions = currentQuestion.questions || [];
			let hasErrors = false;
			const newErrors = { ...errors };

			questions.forEach((question) => {
				if (question.required) {
					const answer = answers[question.id];
					if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
						newErrors[question.id] = 'Esta pergunta é obrigatória';
						hasErrors = true;
					} else {
						delete newErrors[question.id];
					}
				}
			});

			setErrors(newErrors);
			return !hasErrors;
		}

		// For question groups, validate the current group question
		const questionToValidate = isCurrentQuestionGroup ? currentGroupQuestion : currentQuestion;
		if (!questionToValidate) return true;

		const answer = answers[questionToValidate.id];
		const newErrors = { ...errors };

		if (questionToValidate.required && !validateRequired(answer)) {
			newErrors[questionToValidate.id] = 'Este campo é obrigatório';
		} else if (questionToValidate.type === 'email' && answer && !validateEmail(answer)) {
			newErrors[questionToValidate.id] = 'E-mail inválido';
		} else {
			delete newErrors[questionToValidate.id];
		}

		setErrors(newErrors);
		return !newErrors[questionToValidate.id];
	};

	const collectAllAnswers = (): Answer[] => {
		// Collect answers for all questions that have been answered
		// This ensures we capture answers even for questions that were skipped by workflow
		const allAnswers: Answer[] = [];

		form.questions.forEach((question) => {
			if (question.type === 'question-group' || question.type === 'multiquestion') {
				// For groups and multiquestion, collect answers from all questions in the group
				(question.questions || []).forEach((groupQuestion) => {
					if (answers[groupQuestion.id] !== undefined && answers[groupQuestion.id] !== '') {
						allAnswers.push({
							questionId: groupQuestion.id,
							value: answers[groupQuestion.id] || '',
						});
					}
				});
			} else {
				// For regular questions
				if (answers[question.id] !== undefined && answers[question.id] !== '') {
					allAnswers.push({
						questionId: question.id,
						value: answers[question.id] || '',
					});
				}
			}
		});

		return allAnswers;
	};

	const submitForm = () => {
		const formAnswers = collectAllAnswers();
		const response: Response = {
			id: generateId(),
			formId: form.id,
			submittedAt: new Date().toISOString(),
			answers: formAnswers,
		};
		onSubmit(response);
		setIsCompleted(true);
	};

	const handleNext = () => {
		if (isShowingWelcome) {
			setCurrentQuestionIndex(0);
			setCurrentGroupQuestionIndex(0);
			return;
		}

		if (!validateCurrentAnswer()) return;

		// If we're in a question group, handle group navigation
		if (isCurrentQuestionGroup) {
			if (isLastGroupQuestion) {
				// Move to next main question
				setCurrentGroupQuestionIndex(0);
				if (isLastQuestion) {
					// If there is a final screen, show it instead of immediate submit
					const firstFinal = (form.finals || [])[0] || null;
					if (firstFinal) {
						setShowFinal(firstFinal);
						return;
					}
					// Submit form
					submitForm();
				} else {
					setCurrentQuestionIndex((prev) => prev + 1);
				}
			} else {
				// Move to next question in group
				setCurrentGroupQuestionIndex((prev) => prev + 1);
			}
			return;
		}

		// If we're in a multiquestion, always move to next main question
		if (isCurrentQuestionMulti) {
			setCurrentGroupQuestionIndex(0);
			if (isLastQuestion) {
				// If there is a final screen, show it instead of immediate submit
				const firstFinal = (form.finals || [])[0] || null;
				if (firstFinal) {
					setShowFinal(firstFinal);
					return;
				}
				// Submit form
				submitForm();
			} else {
				setCurrentQuestionIndex((prev) => prev + 1);
			}
			return;
		}

		// Evaluate workflow to determine next step
		const nextByWorkflow = computeNextIndexFromWorkflow();

		if (nextByWorkflow === 'final') {
			const firstFinal = (form.finals || [])[0] || null;
			if (firstFinal) {
				setShowFinal(firstFinal);
				return;
			}
			// Fallback to submit if no finals
			submitForm();
			return;
		}

		if (typeof nextByWorkflow === 'string') {
			// Could be final id
			const targetFinal = (form.finals || []).find((f) => f.id === nextByWorkflow) || null;
			if (targetFinal) {
				setShowFinal(targetFinal);
				return;
			}
		}

		if (nextByWorkflow === 'end') {
			// Submit form
			submitForm();
			return;
		}

		if (typeof nextByWorkflow === 'number' && nextByWorkflow >= 0) {
			// Prevent infinite loop - don't jump to the same question
			if (nextByWorkflow === currentQuestionIndex) {
				// Fall through to normal flow
			} else {
				setCurrentQuestionIndex(nextByWorkflow);
				setCurrentGroupQuestionIndex(0);
				return;
			}
		}

		if (isLastQuestion) {
			// If there is a final screen, show it instead of immediate submit
			const firstFinal = (form.finals || [])[0] || null;
			if (firstFinal) {
				setShowFinal(firstFinal);
				return;
			}
			// Submit form
			submitForm();
		} else {
			setCurrentQuestionIndex((prev) => prev + 1);
			setCurrentGroupQuestionIndex(0);
		}
	};

	const handlePrevious = () => {
		if (currentQuestionIndex === 0 && hasWelcomeScreen) {
			setCurrentQuestionIndex(-1);
			return;
		}

		// If we're in a question group, handle group navigation
		if (isCurrentQuestionGroup || isCurrentQuestionMulti) {
			if (currentGroupQuestionIndex > 0) {
				// Move to previous question in group
				setCurrentGroupQuestionIndex((prev) => prev - 1);
			} else {
				// Move to previous main question
				if (currentQuestionIndex > 0) {
					setCurrentQuestionIndex((prev) => prev - 1);
					// Reset group question index for the new question
					const prevQuestion = form.questions[currentQuestionIndex - 1];
					if (prevQuestion?.type === 'question-group') {
						setCurrentGroupQuestionIndex((prevQuestion.questions || []).length - 1);
					} else {
						setCurrentGroupQuestionIndex(0);
					}
				}
			}
		} else {
			// Regular question navigation
			if (currentQuestionIndex > 0) {
				setCurrentQuestionIndex((prev) => prev - 1);
				// Reset group question index
				setCurrentGroupQuestionIndex(0);
			}
		}
	};

	const handleAnswerChange = (value: any, questionId?: string) => {
		// For multiquestion, we need to pass the questionId explicitly
		const targetQuestionId =
			questionId ||
			(isCurrentQuestionGroup || isCurrentQuestionMulti
				? currentGroupQuestion?.id
				: currentQuestion.id);
		if (!targetQuestionId) return;

		setAnswers((prev) => ({
			...prev,
			[targetQuestionId]: value,
		}));

		// Clear error when user starts typing
		if (errors[targetQuestionId]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[targetQuestionId];
				return newErrors;
			});
		}
	};

	const renderMultiQuestionInput = () => {
		if (!currentQuestion || currentQuestion.type !== 'multiquestion') return null;

		const questions = currentQuestion.questions || [];

		return (
			<div className='space-y-8'>
				{questions.map((question, index) => {
					const currentAnswer = answers[question.id] || '';
					const hasError = !!errors[question.id];

					return (
						<div
							key={question.id}
							id={`op-multiquestion-item-${question.id}`}
							className='border-b border-gray-200 pb-6 last:border-b-0'
						>
							<div className='mb-4'>
								<h3
									id={`op-question-title-${question.id}`}
									className='text-xl font-semibold mb-2 text-gray-900'
								>
									{question.title}
									{question.required && <span className='text-red-500 ml-1'>*</span>}
								</h3>
								{question.description && (
									<p id={`op-question-description-${question.id}`} className='text-gray-600 mb-4'>
										{question.description}
									</p>
								)}
							</div>

							<div className='space-y-4'>
								{renderQuestionInputByType(question, currentAnswer, hasError, question.id)}
							</div>

							{hasError && <div className='mt-2 text-red-500 text-sm'>{errors[question.id]}</div>}
						</div>
					);
				})}
			</div>
		);
	};

	const renderQuestionInputByType = (
		question: Question,
		currentAnswer: any,
		hasError: boolean,
		questionId?: string
	) => {
		switch (question.type) {
			case 'short-text':
				return (
					<input
						id={`op-question-input-${question.id}`}
						type='text'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, question.id)}
						className={`w-full px-4 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='Digite sua resposta...'
						autoFocus={false}
					/>
				);

			case 'long-text':
				return (
					<textarea
						id={`op-question-input-${question.id}`}
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, question.id)}
						className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-transparent focus:outline-none transition-colors resize-none ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='Digite sua resposta...'
						rows={4}
						autoFocus={false}
					/>
				);

			case 'email':
				return (
					<input
						id={`op-question-input-${question.id}`}
						type='email'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, question.id)}
						className={`w-full px-4 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='seu@email.com'
						autoFocus={false}
					/>
				);

			case 'number':
				return (
					<input
						id={`op-question-input-${question.id}`}
						type='number'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, question.id)}
						className={`w-full px-4 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='0'
						autoFocus={false}
					/>
				);

			case 'date':
				return (
					<input
						id={`op-question-input-${question.id}`}
						type='date'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, question.id)}
						className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						autoFocus={false}
					/>
				);

			case 'multiple-choice':
				return (
					<div className='space-y-3'>
						{(question.options || []).map((option, index) => (
							<label
								key={index}
								id={`op-question-option-${question.id}-${index}`}
								className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
									currentAnswer === option
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'
								}`}
							>
								<input
									id={`op-question-option-input-${question.id}-${index}`}
									type='radio'
									name={question.id}
									value={option}
									checked={currentAnswer === option}
									onChange={(e) => handleAnswerChange(e.target.value, question.id)}
									className='sr-only'
								/>
								<div
									className={`w-4 h-4 rounded-full border-2 mr-3 ${
										currentAnswer === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
									}`}
								>
									{currentAnswer === option && (
										<div className='w-2 h-2 bg-white rounded-full m-0.5' />
									)}
								</div>
								<span className='text-gray-700'>{option}</span>
							</label>
						))}
					</div>
				);

			case 'rating':
				return (
					<div className='flex justify-center space-x-2'>
						{[1, 2, 3, 4, 5].map((rating) => (
							<button
								key={rating}
								id={`op-question-rating-${question.id}-${rating}`}
								type='button'
								onClick={() => handleAnswerChange(rating.toString(), question.id)}
								className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition-colors ${
									currentAnswer === rating.toString()
										? 'border-blue-500 bg-blue-500 text-white'
										: 'border-gray-300 hover:border-gray-400'
								}`}
							>
								{rating}
							</button>
						))}
					</div>
				);

			default:
				return null;
		}
	};

	const renderQuestionInput = () => {
		if (!currentQuestion) return null;

		// For multiquestion, render all questions at once
		if (isCurrentQuestionMulti) {
			return renderMultiQuestionInput();
		}

		// For question groups, render the current group question
		const questionToRender = isCurrentQuestionGroup ? currentGroupQuestion : currentQuestion;
		if (!questionToRender) return null;

		const currentAnswer = answers[questionToRender.id] || '';
		const hasError = !!errors[questionToRender.id];

		switch (questionToRender.type) {
			case 'short-text':
				return (
					<input
						id={`op-question-input-${questionToRender.id}`}
						type='text'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, questionToRender.id)}
						className={`w-full px-4 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='Digite sua resposta...'
						autoFocus
					/>
				);

			case 'long-text':
				return (
					<textarea
						id={`op-question-input-${questionToRender.id}`}
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, questionToRender.id)}
						rows={4}
						className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-transparent focus:outline-none transition-colors resize-none ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='Digite sua resposta...'
						autoFocus
					/>
				);

			case 'email':
				return (
					<input
						id={`op-question-input-${questionToRender.id}`}
						type='email'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, questionToRender.id)}
						className={`w-full px-4 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='seu@email.com'
						autoFocus
					/>
				);

			case 'number':
				return (
					<input
						id={`op-question-input-${questionToRender.id}`}
						type='number'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, questionToRender.id)}
						className={`w-full px-4 py-3 text-lg border-0 border-b-2 bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						placeholder='0'
						autoFocus
					/>
				);

			case 'date':
				return (
					<input
						id={`op-question-input-${questionToRender.id}`}
						type='date'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value, questionToRender.id)}
						className={`w-full px-4 py-3 text-lg border-2 rounded-lg bg-transparent focus:outline-none transition-colors ${
							hasError
								? 'border-red-500 focus:border-red-500'
								: 'border-gray-300 focus:border-blue-500'
						}`}
						autoFocus
					/>
				);

			case 'multiple-choice':
				return (
					<div className='space-y-3'>
						{(questionToRender.options || []).map((option, index) => (
							<label
								key={index}
								id={`op-question-option-${questionToRender.id}-${index}`}
								className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
									currentAnswer === option
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'
								}`}
							>
								<input
									id={`op-question-option-input-${questionToRender.id}-${index}`}
									type='radio'
									name={questionToRender.id}
									value={option}
									checked={currentAnswer === option}
									onChange={(e) => handleAnswerChange(e.target.value, questionToRender.id)}
									className='sr-only'
								/>
								<div
									className={`w-4 h-4 rounded-full border-2 mr-3 ${
										currentAnswer === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
									}`}
								>
									{currentAnswer === option && (
										<div className='w-full h-full rounded-full bg-white scale-50'></div>
									)}
								</div>
								<span className='text-lg'>{option}</span>
							</label>
						))}
					</div>
				);

			case 'rating':
				return (
					<div className='flex items-center justify-center space-x-2'>
						{[1, 2, 3, 4, 5].map((rating) => (
							<button
								key={rating}
								id={`op-question-rating-${questionToRender.id}-${rating}`}
								onClick={() => handleAnswerChange(rating)}
								className={`p-2 transition-colors ${
									currentAnswer >= rating
										? 'text-yellow-400'
										: 'text-gray-300 hover:text-yellow-300'
								}`}
							>
								<Star className='h-8 w-8 fill-current' />
							</button>
						))}
					</div>
				);

			default:
				return null;
		}
	};

	if (isShowingWelcome) {
		return (
			<div
				key='welcome'
				id='op-form-container'
				className={`min-h-screen${
					useCustomBg ? '' : ' bg-gradient-to-br from-blue-50 to-indigo-100'
				}`}
				style={pageStyle}
			>
				<div className='p-4'>
					{customCssStyle}
					{onBack && (
						<div className='fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50'>
							<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end'>
								<button
									onClick={onBack}
									className='px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
								>
									Fechar visualização
								</button>
							</div>
						</div>
					)}

					<div className='flex items-center justify-between max-w-4xl mx-auto'>
						{!form.hideFormTitle && (
							<h1 id='op-form-title' className='text-lg font-semibold' style={titleStyle}>
								{form.title}
							</h1>
						)}
						{!form.hideQuestionNumber && <div className='text-sm text-gray-500' />}
					</div>
				</div>
				<div
					id='op-welcome-screen'
					className='flex items-center justify-center min-h-[calc(100vh-120px)] p-4'
				>
					<div className='w-full max-w-2xl'>
						<div className='text-center mb-8'>
							<h2
								id='op-welcome-title'
								className='text-3xl md:text-4xl font-bold mb-4'
								style={questionTextStyle}
							>
								{form.welcomeScreen?.title}
							</h2>
							{form.welcomeScreen?.description && (
								<p id='op-welcome-description' className='text-xl mb-8' style={questionTextStyle}>
									{form.welcomeScreen.description}
								</p>
							)}
						</div>
						<div className='bg-white rounded-2xl shadow-lg p-8 mb-8 text-center'>
							{form.welcomeScreen?.showButton !== false && (
								<button
									id='op-welcome-btn'
									onClick={handleNext}
									className={buttonClass}
									style={primaryButtonStyle}
								>
									{form.welcomeScreen?.buttonText || 'Começar'}
									<PlayCircle className='h-5 w-5 ml-2' />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (showFinal) {
		const useCustomBgFinal = Boolean(
			form.design?.backgroundColor || form.design?.backgroundImageUrl
		);

		return (
			<div
				id='op-form-container'
				className={`min-h-screen${
					useCustomBgFinal ? '' : ' bg-gradient-to-br from-blue-50 to-indigo-100'
				}`}
				style={pageStyle}
			>
				<div className='p-4'>
					{customCssStyle}
					<div className='flex items-center justify-between max-w-4xl mx-auto'>
						{!form.hideFormTitle && (
							<h1 id='op-form-title' className='text-lg font-semibold' style={titleStyle}>
								{form.title}
							</h1>
						)}
						{!form.hideQuestionNumber && (
							<div className='text-sm text-gray-500'>{/* no counter on final */}</div>
						)}
					</div>
				</div>
				<div
					id={`op-final-screen-${showFinal.id}`}
					className='flex items-center justify-center min-h-[calc(100vh-120px)] p-4'
				>
					<div className='w-full max-w-2xl'>
						<div className='text-center mb-8'>
							<h2
								id={`op-final-title-${showFinal.id}`}
								className='text-3xl md:text-4xl font-bold mb-4'
								style={questionTextStyle}
							>
								{showFinal.title}
							</h2>
							{showFinal.description && (
								<p
									id={`op-final-description-${showFinal.id}`}
									className='text-xl mb-8'
									style={questionTextStyle}
								>
									{showFinal.description}
								</p>
							)}
						</div>
						<div className='bg-white rounded-2xl shadow-lg p-8 mb-8 text-center'>
							{showFinal.showButton !== false && (
								<button
									id={`op-final-btn-${showFinal.id}`}
									onClick={() => {
										// End flow and submit
										submitForm();
									}}
									className={buttonClass}
									style={primaryButtonStyle}
								>
									{showFinal.buttonText || 'Concluir'}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (isCompleted) {
		return (
			<div
				id='op-completion-screen'
				className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'
				style={pageStyle}
			>
				<div className='max-w-md w-full text-center'>
					<div className='bg-white rounded-2xl shadow-lg p-8'>
						<div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
							<svg
								className='w-8 h-8 text-green-500'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M5 13l4 4L19 7'
								/>
							</svg>
						</div>
						<h2 className='text-2xl font-bold text-gray-900 mb-4'>Obrigado!</h2>
						<p className='text-gray-600 mb-6'>
							Sua resposta foi enviada com sucesso. Agradecemos sua participação!
						</p>
						{onBack && (
							<button
								onClick={onBack}
								className='inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700'
							>
								Voltar ao início
							</button>
						)}
					</div>
				</div>
			</div>
		);
	}

	// removed duplicate style declarations (defined earlier)
	return (
		<div
			key='form-view'
			id='op-form-container'
			className={`min-h-screen${
				useCustomBg ? '' : ' bg-gradient-to-br from-blue-50 to-indigo-100'
			}`}
			style={pageStyle}
		>
			{customCssStyle}
			{onBack && (
				<div className='fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50'>
					<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end'>
						<button
							onClick={onBack}
							className='px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
						>
							Fechar visualização
						</button>
					</div>
				</div>
			)}

			{/* Progress Bar */}
			{!form.hideProgressBar && (
				<div className='fixed top-0 left-0 w-full h-1 bg-gray-200 z-50'>
					<div
						className='h-full bg-blue-500 transition-all duration-300 ease-out'
						style={{ width: `${progress}%` }}
					/>
				</div>
			)}

			{/* Header */}
			<div className='p-4'>
				<div className='flex items-center justify-between max-w-4xl mx-auto'>
					{!form.hideFormTitle && (
						<h1 id='op-form-title' className='text-lg font-semibold' style={titleStyle}>
							{form.title}
						</h1>
					)}
					{!form.hideQuestionNumber && currentQuestionIndex >= 0 && (
						<div className='text-sm text-gray-500'>
							{currentQuestionIndex + 1} de {form.questions.length}
						</div>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className='flex items-center justify-center min-h-[calc(100vh-120px)] p-4'>
				<div className='w-full max-w-2xl'>
					{currentQuestion && (
						<div id={`op-question-${currentQuestion.id}`} className='text-center mb-8'>
							{/* Group title and description */}
							{isCurrentQuestionGroup && (
								<div className='mb-6'>
									<h1
										id={`op-group-title-${currentQuestion.id}`}
										className='text-2xl md:text-3xl font-bold mb-2'
										style={questionTextStyle}
									>
										{currentQuestion.title}
									</h1>
									{currentQuestion.description && (
										<p
											id={`op-group-description-${currentQuestion.id}`}
											className='text-lg mb-4'
											style={questionTextStyle}
										>
											{currentQuestion.description}
										</p>
									)}
									<div className='text-sm text-gray-500 mb-4'>
										Pergunta {currentGroupQuestionIndex + 1} de {groupQuestions.length}
									</div>
								</div>
							)}

							{/* Multiquestion title and description */}
							{isCurrentQuestionMulti && (
								<div className='mb-6'>
									<h1
										id={`op-multiquestion-title-${currentQuestion.id}`}
										className='text-2xl md:text-3xl font-bold mb-2'
										style={questionTextStyle}
									>
										{currentQuestion.title}
									</h1>
									{currentQuestion.description && (
										<p
											id={`op-multiquestion-description-${currentQuestion.id}`}
											className='text-lg mb-4'
											style={questionTextStyle}
										>
											{currentQuestion.description}
										</p>
									)}
								</div>
							)}

							{/* Current question title and description (only for question groups) */}
							{isCurrentQuestionGroup && currentGroupQuestion && (
								<div>
									<h2
										id={`op-question-title-${currentGroupQuestion.id}`}
										className='text-3xl md:text-4xl font-bold mb-4'
										style={questionTextStyle}
									>
										{currentGroupQuestion.title}
										{currentGroupQuestion.required && <span className='text-red-500 ml-1'>*</span>}
									</h2>
									{currentGroupQuestion.description && (
										<p
											id={`op-question-description-${currentGroupQuestion.id}`}
											className='text-xl mb-8'
											style={questionTextStyle}
										>
											{currentGroupQuestion.description}
										</p>
									)}
								</div>
							)}

							{/* Regular question (not in group) */}
							{!isCurrentQuestionGroup && !isCurrentQuestionMulti && (
								<div>
									<h2
										id={`op-question-title-${currentQuestion.id}`}
										className='text-3xl md:text-4xl font-bold mb-4'
										style={questionTextStyle}
									>
										{currentQuestion.title}
										{currentQuestion.required && <span className='text-red-500 ml-1'>*</span>}
									</h2>
									{currentQuestion.description && (
										<p
											id={`op-question-description-${currentQuestion.id}`}
											className='text-xl mb-8'
											style={questionTextStyle}
										>
											{currentQuestion.description}
										</p>
									)}
								</div>
							)}
						</div>
					)}

					<div
						id={`op-question-input-container-${
							isCurrentQuestionGroup ? currentGroupQuestion?.id : currentQuestion?.id
						}`}
						className='bg-white rounded-2xl shadow-lg p-8 mb-8'
					>
						{renderQuestionInput()}

						{/* Error display for question groups */}
						{isCurrentQuestionGroup && currentGroupQuestion && errors[currentGroupQuestion.id] && (
							<div className='mt-4 text-red-500 text-sm'>{errors[currentGroupQuestion.id]}</div>
						)}

						{/* Error display for regular questions */}
						{!isCurrentQuestionGroup &&
							!isCurrentQuestionMulti &&
							currentQuestion &&
							errors[currentQuestion.id] && (
								<div className='mt-4 text-red-500 text-sm'>{errors[currentQuestion.id]}</div>
							)}
					</div>

					{/* Navigation */}
					<div className='flex items-center justify-between'>
						<button
							id='op-form-prev-btn'
							onClick={handlePrevious}
							disabled={
								currentQuestionIndex <= 0 && currentGroupQuestionIndex === 0 && !hasWelcomeScreen
							}
							className={`inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
								currentQuestionIndex <= 0 && currentGroupQuestionIndex === 0 && !hasWelcomeScreen
									? 'text-gray-400 cursor-not-allowed'
									: 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md'
							}`}
						>
							<ChevronLeft className='h-4 w-4 mr-2' />
							Anterior
						</button>

						<button
							id='op-form-next-btn'
							onClick={handleNext}
							className={buttonClass}
							style={primaryButtonStyle}
						>
							{isCurrentQuestionGroup || isCurrentQuestionMulti
								? isLastGroupQuestion && isLastQuestion
									? 'Enviar'
									: 'Próxima'
								: isLastQuestion
								? 'Enviar'
								: 'Próxima'}
							{!(
								((isCurrentQuestionGroup || isCurrentQuestionMulti) &&
									isLastGroupQuestion &&
									isLastQuestion) ||
								(!isCurrentQuestionGroup && !isCurrentQuestionMulti && isLastQuestion)
							) && <ChevronRight className='h-4 w-4 ml-2' />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
