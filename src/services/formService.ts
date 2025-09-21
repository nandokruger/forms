import {
	collection,
	doc,
	getDocs,
	getDoc,
	query,
	where,
	orderBy,
	addDoc,
	setDoc,
	deleteDoc,
	updateDoc,
	increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Form, Question, Response } from '../types';

const mapQuestionDocToQuestion = (id: string, data: any): Question => {
	return {
		id,
		type: data.type,
		title: data.title,
		description: data.description,
		required: Boolean(data.required),
		order: typeof data.order === 'number' ? data.order : 0,
		options: data.options,
		questions: data.questions || undefined, // Include nested questions
	} as Question;
};

// Ensure Firestore-friendly objects (no undefined)
const replaceUndefinedWithNull = (value: any): any => {
	if (value === undefined) return null;
	if (value === null) return null;
	if (Array.isArray(value)) return value.map(replaceUndefinedWithNull);
	if (typeof value === 'object') {
		const cleaned: any = {};
		for (const key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				cleaned[key] = replaceUndefinedWithNull(value[key]);
			}
		}
		return cleaned;
	}
	return value;
};

const mapFormDocToForm = async (formId: string, formData: any): Promise<Form> => {
	const fieldsRef = collection(db, 'forms', formId, 'questions');
	const fieldsQuery = query(fieldsRef, orderBy('order'));
	const fieldsSnapshot = await getDocs(fieldsQuery);

	const questions: Question[] = fieldsSnapshot.docs.map((d) =>
		mapQuestionDocToQuestion(d.id, d.data())
	);

	return {
		id: formId,
		title: formData.title,
		description: formData.description,
		createdAt: formData.createdAt?.toDate?.()
			? formData.createdAt.toDate().toISOString()
			: formData.createdAt || new Date().toISOString(),
		updatedAt: formData.updatedAt?.toDate?.()
			? formData.updatedAt.toDate().toISOString()
			: formData.updatedAt || formData.createdAt || new Date().toISOString(),
		userId: formData.userId || '',
		isPublished: Boolean(formData.isPublished ?? formData.isActive),
		responseCount: typeof formData.responseCount === 'number' ? formData.responseCount : 0,
		questions,
		workflow: formData.workflow || { rules: [] },
		// UI settings
		hideFormTitle: Boolean(formData.hideFormTitle),
		hideQuestionNumber: Boolean(formData.hideQuestionNumber),
		hideProgressBar: Boolean(formData.hideProgressBar),
		design: formData.design || undefined,
		finals: formData.finals || [],
		embedConfig: formData.embedConfig || undefined,
	} as Form;
};

export const getPublishedForms = async (): Promise<Form[]> => {
	const formsRef = collection(db, 'forms');
	const q = query(formsRef, where('isPublished', '==', true));
	const snapshot = await getDocs(q);

	const forms: Form[] = [];
	for (const formDoc of snapshot.docs) {
		const formData = formDoc.data();
		const form = await mapFormDocToForm(formDoc.id, formData);
		forms.push(form);
	}
	return forms;
};

export const getAllForms = async (): Promise<Form[]> => {
	const formsRef = collection(db, 'forms');
	const snapshot = await getDocs(formsRef);
	const forms: Form[] = [];
	for (const formDoc of snapshot.docs) {
		const formData = formDoc.data();
		const form = await mapFormDocToForm(formDoc.id, formData);
		forms.push(form);
	}
	return forms;
};

export const getFormById = async (formId: string): Promise<Form | null> => {
	const formSnap = await getDoc(doc(db, 'forms', formId));
	if (!formSnap.exists()) return null;
	const formData = formSnap.data();
	return mapFormDocToForm(formSnap.id, formData);
};

export const saveForm = async (form: Form): Promise<string> => {
	// Determine if updating or creating
	let targetFormId = form.id;
	let isUpdate = false;
	if (targetFormId) {
		const existing = await getDoc(doc(db, 'forms', targetFormId));
		isUpdate = existing.exists();
	}

	if (!isUpdate) {
		const newRef = doc(collection(db, 'forms'));
		targetFormId = newRef.id;
		await setDoc(newRef, {
			title: form.title,
			description: form.description || '',
			isPublished: !!form.isPublished,
			userId: form.userId || '',
			workflow: replaceUndefinedWithNull(form.workflow || { rules: [] }),
			// UI settings
			hideFormTitle: !!form.hideFormTitle,
			hideQuestionNumber: !!form.hideQuestionNumber,
			hideProgressBar: !!form.hideProgressBar,
			design: replaceUndefinedWithNull(form.design || {}),
			finals: replaceUndefinedWithNull(form.finals || []),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	} else {
		await setDoc(
			doc(db, 'forms', targetFormId),
			{
				title: form.title,
				description: form.description || '',
				isPublished: !!form.isPublished,
				userId: form.userId || '',
				workflow: replaceUndefinedWithNull(form.workflow || { rules: [] }),
				// UI settings
				hideFormTitle: !!form.hideFormTitle,
				hideQuestionNumber: !!form.hideQuestionNumber,
				hideProgressBar: !!form.hideProgressBar,
				design: replaceUndefinedWithNull(form.design || {}),
				finals: replaceUndefinedWithNull(form.finals || []),
				embedConfig: replaceUndefinedWithNull(form.embedConfig || {}),
				updatedAt: new Date(),
			},
			{ merge: true }
		);
	}

	// Rewrite questions subcollection
	const questionsRef = collection(db, 'forms', targetFormId!, 'questions');
	if (isUpdate) {
		const existingQuestions = await getDocs(questionsRef);
		for (const q of existingQuestions.docs) {
			await deleteDoc(q.ref);
		}
	}
	for (const q of form.questions) {
		const qRef = doc(questionsRef, q.id);
		await setDoc(qRef, {
			type: q.type,
			title: q.title,
			description: q.description || '',
			required: !!q.required,
			order: typeof q.order === 'number' ? q.order : 0,
			options: q.options || [],
			questions: q.questions || null, // Include nested questions
		});
	}

	return targetFormId!;
};

export const deleteFormFirestore = async (formId: string): Promise<void> => {
	const questionsRef = collection(db, 'forms', formId, 'questions');
	const qs = await getDocs(questionsRef);
	for (const d of qs.docs) {
		await deleteDoc(d.ref);
	}
	await deleteDoc(doc(db, 'forms', formId));
};

// Response functions
export const saveResponse = async (response: Response): Promise<string> => {
	const responsesRef = collection(db, 'responses');
	const docRef = await addDoc(responsesRef, {
		formId: response.formId,
		submittedAt: new Date(response.submittedAt),
		answers: response.answers,
	});

	// Update form response count
	const formRef = doc(db, 'forms', response.formId);
	await updateDoc(formRef, {
		responseCount: increment(1),
	});

	return docRef.id;
};

export const getResponsesByFormId = async (formId: string): Promise<Response[]> => {
	const responsesRef = collection(db, 'responses');
	const q = query(responsesRef, where('formId', '==', formId));
	const snapshot = await getDocs(q);

	const responses = snapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			formId: data.formId,
			submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
			answers: data.answers || [],
		} as Response;
	});

	// Sort by submittedAt in JavaScript (descending)
	return responses.sort(
		(a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
	);
};
