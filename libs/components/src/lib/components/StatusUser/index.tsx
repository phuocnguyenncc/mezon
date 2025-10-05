import { Icons } from '@mezon/ui';
export const RenderTypingIndicator = () => (
	<span className={`absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-theme-primary rounded-lg -right-2`}>
		<Icons.IconLoadingTyping bgFill="bg-colorSuccess" />
	</span>
);

type Status = 'online' | 'idle' | 'dnd' | 'offline';

const statusColors: Record<Status, string> = {
	online: 'bg-green-500',
	idle: 'bg-yellow-500',
	dnd: 'bg-red-500',
	offline: 'bg-gray-400'
};

export const StatusUser: React.FC<{ status: Status; className?: string }> = ({ status, className = ' w-[12px] h-[12px] p-[2px]' }) => {
	return (
		<div className={`${className} status-user-background rounded-full`}>
			<div className={`w-full h-full rounded-full ${statusColors[status]} relative`}></div>
		</div>
	);
};
