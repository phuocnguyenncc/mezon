type UserDescriptionProps = {
	title: string;
	detail: string;
};

const UserDescription = ({ title, detail }: UserDescriptionProps) => {
	return (
		detail && (
			<>
				<div className="w-full border-b-theme-primary p-2"></div>
				<div className="flex flex-col">
					<div className="font-bold tracking-wider text-xs pt-2 text-theme-primary-active">{title}</div>
					<div className="font-normal tracking-wider text-xs one-line pt-2">{detail}</div>
				</div>
			</>
		)
	);
};
export default UserDescription;
