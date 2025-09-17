import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Form, Answer, Response, WorkflowRule } from '../types';
import { generateId, validateEmail, validateRequired } from '../utils/helpers';

interface FormViewProps {
	form: Form;
	onSubmit: (response: Response) => void;
	onBack?: () => void;
}

export const FormView: React.FC<FormViewProps> = ({ form, onSubmit, onBack }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [isCompleted, setIsCompleted] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const currentQuestion = form.questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === form.questions.length - 1;
	const progress = ((currentQuestionIndex + 1) / form.questions.length) * 100;

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

	const computeNextIndexFromWorkflow = (): number | 'end' | null => {
		const rules = form.workflow?.rules || [];
		for (const rule of rules) {
			if (rule.type === 'if') {
				if (!evaluateIfRule(rule)) continue;
			}
			// Actions processing
			if (rule.actions && rule.actions.length > 0) {
				for (const action of rule.actions) {
					if (action.type === 'jumpTo') {
						if (action.targetQuestionId === 'end_form') return 'end';
						const idx = findQuestionIndexById(action.targetQuestionId);
						if (idx >= 0) return idx;
					}
					if (action.type === 'endForm') return 'end';
					// showMessage and others are non-navigational here
				}
			}
			// If rule type is 'always' and no actionable navigation, continue
		}
		return null; // no rule matched
	};

	const validateCurrentAnswer = () => {
		if (!currentQuestion) return true;

		const answer = answers[currentQuestion.id];
		const newErrors = { ...errors };

		if (currentQuestion.required && !validateRequired(answer)) {
			newErrors[currentQuestion.id] = 'Este campo é obrigatório';
		} else if (currentQuestion.type === 'email' && answer && !validateEmail(answer)) {
			newErrors[currentQuestion.id] = 'E-mail inválido';
		} else {
			delete newErrors[currentQuestion.id];
		}

		setErrors(newErrors);
		return !newErrors[currentQuestion.id];
	};

	const handleNext = () => {
		if (!validateCurrentAnswer()) return;

		// Evaluate workflow to determine next step
		const nextByWorkflow = computeNextIndexFromWorkflow();
		if (nextByWorkflow === 'end') {
			// Submit form
			const formAnswers: Answer[] = form.questions.map((question) => ({
				questionId: question.id,
				value: answers[question.id] || '',
			}));

			const response: Response = {
				id: generateId(),
				formId: form.id,
				submittedAt: new Date().toISOString(),
				answers: formAnswers,
			};

			onSubmit(response);
			setIsCompleted(true);
			return;
		}

		if (typeof nextByWorkflow === 'number' && nextByWorkflow >= 0) {
			setCurrentQuestionIndex(nextByWorkflow);
			return;
		}

		if (isLastQuestion) {
			// Submit form
			const formAnswers: Answer[] = form.questions.map((question) => ({
				questionId: question.id,
				value: answers[question.id] || '',
			}));

			const response: Response = {
				id: generateId(),
				formId: form.id,
				submittedAt: new Date().toISOString(),
				answers: formAnswers,
			};

			onSubmit(response);
			setIsCompleted(true);
		} else {
			setCurrentQuestionIndex((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
		}
	};

	const handleAnswerChange = (value: any) => {
		setAnswers((prev) => ({
			...prev,
			[currentQuestion.id]: value,
		}));

		// Clear error when user starts typing
		if (errors[currentQuestion.id]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[currentQuestion.id];
				return newErrors;
			});
		}
	};

	const renderQuestionInput = () => {
		if (!currentQuestion) return null;

		const currentAnswer = answers[currentQuestion.id] || '';
		const hasError = !!errors[currentQuestion.id];

		switch (currentQuestion.type) {
			case 'short-text':
				return (
					<input
						type='text'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value)}
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
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value)}
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
						type='email'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value)}
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
						type='number'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value)}
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
						type='date'
						value={currentAnswer}
						onChange={(e) => handleAnswerChange(e.target.value)}
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
						{(currentQuestion.options || []).map((option, index) => (
							<label
								key={index}
								className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
									currentAnswer === option
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-200 hover:border-gray-300'
								}`}
							>
								<input
									type='radio'
									name={currentQuestion.id}
									value={option}
									checked={currentAnswer === option}
									onChange={(e) => handleAnswerChange(e.target.value)}
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

	if (isCompleted) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<div className='max-w-md w-full text-center'>
					<div className='bg-white rounded-2xl shadow-lg p-8'>
						<div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
							<svg
								className='w-8 h-8 text-green-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
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

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
			{/* Progress Bar */}
			<div className='fixed top-0 left-0 w-full h-1 bg-gray-200 z-50'>
				<div
					className='h-full bg-blue-500 transition-all duration-300 ease-out'
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* Header */}
			<div className='p-4'>
				<div className='flex items-center justify-between max-w-4xl mx-auto'>
					<h1 className='text-lg font-semibold text-gray-900'>{form.title}</h1>
					<div className='text-sm text-gray-500'>
						{currentQuestionIndex + 1} de {form.questions.length}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='flex items-center justify-center min-h-[calc(100vh-120px)] p-4'>
				<div className='w-full max-w-2xl'>
					{currentQuestion && (
						<div className='text-center mb-8'>
							<h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
								{currentQuestion.title}
								{currentQuestion.required && <span className='text-red-500 ml-1'>*</span>}
							</h2>
							{currentQuestion.description && (
								<p className='text-xl text-gray-600 mb-8'>{currentQuestion.description}</p>
							)}
						</div>
					)}

					<div className='bg-white rounded-2xl shadow-lg p-8 mb-8'>
						{renderQuestionInput()}

						{errors[currentQuestion?.id] && (
							<div className='mt-4 text-red-500 text-sm'>{errors[currentQuestion.id]}</div>
						)}
					</div>

					{/* Navigation */}
					<div className='flex items-center justify-between'>
						<button
							onClick={handlePrevious}
							disabled={currentQuestionIndex === 0}
							className={`inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
								currentQuestionIndex === 0
									? 'text-gray-400 cursor-not-allowed'
									: 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md'
							}`}
						>
							<ChevronLeft className='h-4 w-4 mr-2' />
							Anterior
						</button>

						<button
							onClick={handleNext}
							className='inline-flex items-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg'
						>
							{isLastQuestion ? 'Enviar' : 'Próxima'}
							{!isLastQuestion && <ChevronRight className='h-4 w-4 ml-2' />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
