import { logEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase';

export const trackQuizStart = (quizId: string, userId?: string) => {
	if (analytics) {
		logEvent(analytics, 'quiz_start', {
			quiz_id: quizId,
			user_id: userId || 'anonymous',
		});
	}
};

export const trackQuestionAnswer = (quizId: string, questionId: string, userId?: string) => {
	if (analytics) {
		logEvent(analytics, 'question_answer', {
			quiz_id: quizId,
			question_id: questionId,
			user_id: userId || 'anonymous',
		});
	}
};

export const trackQuizComplete = (quizId: string, userId?: string) => {
	if (analytics) {
		logEvent(analytics, 'quiz_complete', {
			quiz_id: quizId,
			user_id: userId || 'anonymous',
		});
	}
};
