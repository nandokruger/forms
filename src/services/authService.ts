import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const signIn = async (email: string, password: string) => {
	const userCredential = await signInWithEmailAndPassword(auth, email, password);
	return userCredential.user;
};

export const signUp = async (email: string, password: string) => {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	return userCredential.user;
};

export const logout = async () => {
	await signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
	return onAuthStateChanged(auth, callback);
};
