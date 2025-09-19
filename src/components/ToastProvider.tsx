import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { generateId } from '../utils/helpers';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};

interface ToastProps {
	message: string;
	type: ToastType;
	onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
	const typeInfo = {
		success: {
			icon: <CheckCircle className='h-6 w-6 text-green-400' />,
			barClass: 'bg-green-400',
		},
		error: {
			icon: <XCircle className='h-6 w-6 text-red-400' />,
			barClass: 'bg-red-400',
		},
		info: {
			icon: <Info className='h-6 w-6 text-blue-400' />,
			barClass: 'bg-blue-400',
		},
	};

	return (
		<div className='min-w-80 w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden'>
			<div className='p-4'>
				<div className='flex items-start'>
					<div className='flex-shrink-0'>{typeInfo[type].icon}</div>
					<div className='ml-3 w-0 flex-1 pt-0.5'>
						<p className='text-sm font-medium text-gray-900'>{message}</p>
					</div>
					<div className='ml-4 flex-shrink-0 flex'>
						<button
							onClick={onClose}
							className='bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
						>
							<span className='sr-only'>Close</span>
							<X className='h-5 w-5' />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const showToast = useCallback((message: string, type: ToastType = 'info') => {
		const id = generateId();
		setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
		setTimeout(() => {
			removeToast(id);
		}, 55000); // Auto-dismiss after 5 seconds
	}, []);

	const removeToast = (id: string) => {
		setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className='fixed top-5 right-5 z-[2000] space-y-2'>
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						message={toast.message}
						type={toast.type}
						onClose={() => removeToast(toast.id)}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
};
