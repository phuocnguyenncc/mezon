import { Icons } from '@mezon/ui';
import { ReactNode } from 'react';

type ItemStatusProps = {
	children: string;
	dropdown?: boolean;
	type?: 'radio' | 'checkbox' | 'none';
	startIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
};

const ItemStatus = ({ children, dropdown, startIcon, type, onClick, disabled = false }: ItemStatusProps) => {
	return (
		<div
			onClick={!disabled ? onClick : undefined}
			className={`flex items-center justify-between rounded-sm  ${disabled ? '' : 'text-theme-primary-hover bg-item-theme-hover'} px-2`}
			style={{ cursor: disabled ? 'default' : 'pointer' }}
		>
			{startIcon && <div className="flex items-center justify-center h-[18px] w-[18px] mr-2">{startIcon}</div>}
			<li className="text-[14px] w-full py-[6px] list-none">{children}</li>
			{dropdown && <Icons.RightIcon defaultFill="#fff" />}
		</div>
	);
};

export default ItemStatus;
