import { Question, QuestionType } from '../types';

export const generateId = (): string => {
	return Math.random().toString(36).substr(2, 9);
};

export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
};

export const formatDateTime = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

export const createEmptyQuestion = (order: number): Question => ({
	id: generateId(),
	type: 'short-text',
	title: 'Nova pergunta',
	required: false,
	order,
});

export const getQuestionTypeLabel = (type: QuestionType): string => {
	const labels: Record<QuestionType, string> = {
		'short-text': 'Texto Curto',
		'long-text': 'Texto Longo',
		'multiple-choice': 'Múltipla Escolha',
		email: 'E-mail',
		number: 'Número',
		date: 'Data',
		rating: 'Avaliação',
	};
	return labels[type];
};

export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validateRequired = (value: any): boolean => {
	if (typeof value === 'string') {
		return value.trim().length > 0;
	}
	if (Array.isArray(value)) {
		return value.length > 0;
	}
	return value !== null && value !== undefined;
};
