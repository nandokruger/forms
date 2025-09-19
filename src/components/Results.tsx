import React, { useState } from 'react';
import { Download, Calendar, Users, Clock, ChevronRight, BarChart3 } from 'lucide-react';
import { Form, Response } from '../types';
import { formatDateTime } from '../utils/helpers';

interface ResultsProps {
	form: Form | null;
	responses: Response[];
	onBack: () => void;
}

export const Results: React.FC<ResultsProps> = ({ form, responses, onBack }) => {
	const [activeTab, setActiveTab] = useState<'summary' | 'responses'>('summary');
	const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

	if (!form) {
		return (
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='text-center py-12'>
					<p className='text-gray-500'>Selecione um formulário para ver os resultados.</p>
					<button
						onClick={onBack}
						className='mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700'
					>
						Voltar ao Dashboard
					</button>
				</div>
			</div>
		);
	}

	const formResponses = responses.filter((r) => r.formId === form.id);

	const findQuestionById = (questionId: string) => {
		// First, try to find in main questions
		let question = form.questions.find((q) => q.id === questionId);
		if (question) return question;

		// If not found, search in nested questions (groups and multiquestion)
		for (const mainQuestion of form.questions) {
			if (mainQuestion.type === 'question-group' || mainQuestion.type === 'multiquestion') {
				const nestedQuestion = mainQuestion.questions?.find((q) => q.id === questionId);
				if (nestedQuestion) return nestedQuestion;
			}
		}
		return null;
	};

	const getAnswersByQuestion = (questionId: string) => {
		return formResponses
			.map((response) => response.answers.find((answer) => answer.questionId === questionId))
			.filter((answer) => answer && answer.value)
			.map((answer) => answer!.value);
	};

	const calculateStats = () => {
		const totalResponses = formResponses.length;
		const avgTime = totalResponses > 0 ? '3:45' : '0:00'; // Mock average time
		const completionRate = totalResponses > 0 ? '87%' : '0%'; // Mock completion rate

		return { totalResponses, avgTime, completionRate };
	};

	const stats = calculateStats();

	const renderSummaryTab = () => (
		<div className='space-y-8'>
			{/* Stats Cards */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<div className='bg-white rounded-lg border border-gray-200 p-6'>
					<div className='flex items-center'>
						<div className='flex-shrink-0'>
							<Users className='h-8 w-8 text-blue-500' />
						</div>
						<div className='ml-4'>
							<p className='text-2xl font-bold text-gray-900'>{stats.totalResponses}</p>
							<p className='text-sm text-gray-600'>Total de Respostas</p>
						</div>
					</div>
				</div>

				<div className='bg-white rounded-lg border border-gray-200 p-6'>
					<div className='flex items-center'>
						<div className='flex-shrink-0'>
							<Clock className='h-8 w-8 text-green-500' />
						</div>
						<div className='ml-4'>
							<p className='text-2xl font-bold text-gray-900'>{stats.avgTime}</p>
							<p className='text-sm text-gray-600'>Tempo Médio</p>
						</div>
					</div>
				</div>

				<div className='bg-white rounded-lg border border-gray-200 p-6'>
					<div className='flex items-center'>
						<div className='flex-shrink-0'>
							<BarChart3 className='h-8 w-8 text-purple-500' />
						</div>
						<div className='ml-4'>
							<p className='text-2xl font-bold text-gray-900'>{stats.completionRate}</p>
							<p className='text-sm text-gray-600'>Taxa de Conclusão</p>
						</div>
					</div>
				</div>
			</div>

			{/* Questions Analysis */}
			<div className='space-y-6'>
				{form.questions.map((question, index) => {
					if (question.type === 'question-group' || question.type === 'multiquestion') {
						return (
							<div key={question.id} className='bg-white rounded-lg border border-gray-200 p-6'>
								<div className='mb-4'>
									<h3 className='text-lg font-medium text-gray-900'>
										{index + 1}. {question.title}
									</h3>
									<p className='text-sm text-gray-500 mt-1'>
										{question.type === 'question-group'
											? 'Grupo de Perguntas'
											: 'Múltiplas Perguntas'}
									</p>
								</div>
								<div className='space-y-4 pl-4 border-l-2 border-gray-200'>
									{(question.questions || []).map((nestedQuestion, nestedIndex) => {
										const answers = getAnswersByQuestion(nestedQuestion.id);
										return (
											<div key={nestedQuestion.id}>
												<div className='flex items-start justify-between mb-2'>
													<div>
														<h4 className='text-md font-medium text-gray-800'>
															{index + 1}.{nestedIndex + 1}. {nestedQuestion.title}
														</h4>
														<p className='text-sm text-gray-500 mt-1'>{answers.length} respostas</p>
													</div>
												</div>
												{renderAnswerAnalysis(nestedQuestion, answers)}
											</div>
										);
									})}
								</div>
							</div>
						);
					}

					const answers = getAnswersByQuestion(question.id);
					return (
						<div key={question.id} className='bg-white rounded-lg border border-gray-200 p-6'>
							<div className='flex items-start justify-between mb-4'>
								<div>
									<h3 className='text-lg font-medium text-gray-900'>
										{index + 1}. {question.title}
									</h3>
									<p className='text-sm text-gray-500 mt-1'>{answers.length} respostas</p>
								</div>
								<div className='text-right'>
									<p className='text-xs text-gray-400'>Última resposta</p>
									<p className='text-sm text-gray-500'>
										{formResponses.length > 0
											? formatDateTime(formResponses[formResponses.length - 1].submittedAt)
											: 'N/A'}
									</p>
								</div>
							</div>
							{renderAnswerAnalysis(question, answers)}
						</div>
					);
				})}
			</div>
		</div>
	);

	const renderAnswerAnalysis = (question: Form['questions'][0], answers: any[]) => {
		if (question.type === 'multiple-choice') {
			return (
				<div className='space-y-3'>
					{(question.options || []).map((option) => {
						const count = answers.filter((answer) => answer === option).length;
						const percentage = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;

						return (
							<div key={option} className='flex items-center'>
								<div className='flex-1'>
									<div className='flex justify-between items-center mb-1'>
										<span className='text-sm text-gray-700'>{option}</span>
										<span className='text-sm text-gray-500'>
											{count} ({percentage}%)
										</span>
									</div>
									<div className='w-full bg-gray-200 rounded-full h-2'>
										<div
											className='bg-blue-500 h-2 rounded-full transition-all duration-300'
											style={{ width: `${percentage}%` }}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			);
		}

		if (question.type === 'rating') {
			return (
				<div className='space-y-2'>
					{[5, 4, 3, 2, 1].map((rating) => {
						const count = answers.filter((answer) => Number(answer) === rating).length;
						const percentage = answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;

						return (
							<div key={rating} className='flex items-center'>
								<span className='w-8 text-sm text-gray-700'>{rating}★</span>
								<div className='flex-1 ml-3'>
									<div className='flex justify-between items-center mb-1'>
										<div className='w-full bg-gray-200 rounded-full h-2'>
											<div
												className='bg-yellow-400 h-2 rounded-full transition-all duration-300'
												style={{ width: `${percentage}%` }}
											/>
										</div>
										<span className='text-sm text-gray-500 ml-3'>{count}</span>
									</div>
								</div>
							</div>
						);
					})}
					<div className='mt-3 text-sm text-gray-600'>
						Média:{' '}
						{answers.length > 0
							? (answers.reduce((sum, answer) => sum + Number(answer), 0) / answers.length).toFixed(
									1
							  )
							: '0.0'}{' '}
						estrelas
					</div>
				</div>
			);
		}

		return (
			<div className='space-y-2'>
				{answers.slice(0, 3).map((answer, i) => (
					<div key={i} className='p-3 bg-gray-50 rounded-lg'>
						<p className='text-sm text-gray-700'>{String(answer)}</p>
					</div>
				))}
				{answers.length > 3 && (
					<p className='text-sm text-gray-500'>+{answers.length - 3} respostas adicionais</p>
				)}
			</div>
		);
	};

	const renderResponsesTab = () => (
		<div className='space-y-6'>
			{formResponses.length === 0 ? (
				<div className='text-center py-12'>
					<p className='text-gray-500'>Nenhuma resposta ainda.</p>
				</div>
			) : (
				<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
					<div className='px-6 py-4 border-b border-gray-200'>
						<h3 className='text-lg font-medium text-gray-900'>
							Respostas Individuais ({formResponses.length})
						</h3>
					</div>

					<div className='divide-y divide-gray-200'>
						{formResponses.map((response, index) => (
							<div
								key={response.id}
								className='p-6 hover:bg-gray-50 cursor-pointer transition-colors'
								onClick={() => setSelectedResponse(response)}
							>
								<div className='flex items-center justify-between'>
									<p className='text-sm font-medium text-gray-900'>Resposta #{index + 1}</p>
									<div className='flex items-center space-x-4'>
										<p className='text-sm text-gray-500'>{formatDateTime(response.submittedAt)}</p>
										<ChevronRight className='h-5 w-5 text-gray-400' />
									</div>
								</div>

								<div className='mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{response.answers.slice(0, 3).map((answer) => {
										const question = findQuestionById(answer.questionId);
										return (
											<div key={answer.questionId} className='min-w-0'>
												<p className='text-xs text-gray-500 truncate'>{question?.title}</p>
												<p className='text-sm text-gray-900 truncate'>{String(answer.value)}</p>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<button onClick={onBack} className='text-sm text-gray-500 hover:text-gray-700 mb-2'>
						← Voltar
					</button>
					<h1 className='text-3xl font-bold text-gray-900'>{form.title}</h1>
					<p className='mt-2 text-gray-600'>Resultados e análise de respostas</p>
				</div>
				<div className='flex items-center space-x-3'>
					<button className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
						<Download className='h-4 w-4 mr-2' />
						Exportar
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className='border-b border-gray-200 mb-8'>
				<nav className='-mb-px flex space-x-8'>
					<button
						onClick={() => setActiveTab('summary')}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'summary'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Resumo
					</button>
					<button
						onClick={() => setActiveTab('responses')}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'responses'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Respostas
					</button>
				</nav>
			</div>

			{/* Tab Content */}
			{activeTab === 'summary' ? renderSummaryTab() : renderResponsesTab()}

			{/* Response Detail Modal */}
			{selectedResponse && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto'>
						<div className='p-6 border-b border-gray-200'>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-medium text-gray-900'>Detalhes da Resposta</h3>
								<button
									onClick={() => setSelectedResponse(null)}
									className='text-gray-400 hover:text-gray-600'
								>
									✕
								</button>
							</div>
							<p className='text-sm text-gray-500'>
								Enviada em {formatDateTime(selectedResponse.submittedAt)}
							</p>
						</div>

						<div className='p-6 space-y-6'>
							{selectedResponse.answers.map((answer) => {
								const question = findQuestionById(answer.questionId);
								if (!question) return null;

								return (
									<div key={answer.questionId}>
										<h4 className='text-sm font-medium text-gray-900 mb-2'>{question.title}</h4>
										<div className='p-3 bg-gray-50 rounded-lg'>
											<p className='text-sm text-gray-700'>{String(answer.value)}</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
