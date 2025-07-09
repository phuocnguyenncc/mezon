/* eslint-disable no-console */
import { useInvite } from '@mezon/core';
import { fetchSystemMessageByClanId, selectClanById, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Button } from '@mezon/ui';
import isElectron from 'is-electron';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ListMemberInvite from '.';
import { ModalLayout } from '../../components';

const expireAfter = ['30 minutes', '1 hour', '6 hours', '12 hours', '1 day', '7 days', 'Never'];

const maxNumberofUses = ['No limit', '1 use', '5 uses', '10 uses', '25 uses', '50 uses', '100 uses'];

export type ModalParam = {
	onClose: () => void;
	open: boolean;
	// url:string;
	channelID?: string;
	confirmButton?: () => void;
	clanId?: string;
	setShowClanListMenuContext?: () => void;
	isInviteExternalCalling?: boolean;
	privateRoomLink?: string;
};

const ModalInvite = (props: ModalParam) => {
	const [expire, setExpire] = useState('7 days');
	const [max, setMax] = useState('No limit');
	const [modalEdit, setModalEdit] = useState(false);
	const [urlInvite, setUrlInvite] = useState('');
	const currentClanId = useSelector(selectCurrentClanId);
	const { createLinkInviteUser } = useInvite();
	const { onClose, channelID, clanId, setShowClanListMenuContext, isInviteExternalCalling = false } = props;
	const dispatch = useAppDispatch();

	const effectiveClanId = clanId && clanId !== '0' ? clanId : currentClanId;

	const clan = useSelector(selectClanById(effectiveClanId ?? ''));
	const handleOpenInvite = useCallback(async () => {
		try {
			const welcomeChannel = await dispatch(fetchSystemMessageByClanId({ clanId: currentClanId as string })).unwrap();

			const intiveIdChannel = (channelID ? channelID : welcomeChannel.channel_id) as string;
			const res = await createLinkInviteUser(effectiveClanId ?? '', intiveIdChannel, 10);
			if (res && res?.invite_link) {
				setUrlInvite((isElectron() ? process.env.NX_CHAT_APP_REDIRECT_URI : window.location.origin) + '/invite/' + res.invite_link);
			}
		} catch {
			console.log('Error when create invite link');
		}
	}, [channelID, effectiveClanId]);

	useEffect(() => {
		handleOpenInvite();
	}, []);

	const unsecuredCopyToClipboard = (text: string) => {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand('copy');
		} catch (err) {
			console.error('Unable to copy to clipboard', err);
		}
		document.body.removeChild(textArea);
	};

	const handleCopyToClipboard = (content: string) => {
		if (window.isSecureContext && navigator.clipboard) {
			navigator.clipboard.writeText(content);
		} else {
			unsecuredCopyToClipboard(content);
		}
	};

	const closeModalEdit = useCallback(() => setModalEdit(false), []);
	const label = useMemo(() => {}, []);

	if (modalEdit) {
		return <ModalGenerateLinkOption max={max} expire={expire} setExpire={setExpire} setMax={setMax} closeModalEdit={closeModalEdit} />;
	}

	return (
		<ModalLayout onClose={props.onClose}>
			<div className="bg-theme-setting-primary rounded-xl flex flex-col">
				<div className="flex-1 flex items-center justify-between border-b-theme-primary rounded-t p-4">
					<p className="font-bold text-xl text-theme-primary-active">{`Invite friends to ${isInviteExternalCalling ? 'Private Event' : clan?.clan_name}`}</p>
					<Button
						className="rounded-full aspect-square w-6 h-6 text-5xl leading-3 !p-0 opacity-50 text-theme-primary-hover"
						onClick={props.onClose}
					>
						×
					</Button>
				</div>
				<div className="flex flex-col w-[480px] px-5 py-4">
					<ListMemberInvite
						isInviteExternalCalling={isInviteExternalCalling}
						url={isInviteExternalCalling ? (props.privateRoomLink as string) : urlInvite}
						channelID={channelID}
					/>
					<div className="relative ">
						<p className="pt-4 pb-1 text-[12px] mb-12px cursor-default uppercase font-semibold text-theme-primary-active">
							Or, send a {isInviteExternalCalling ? 'private room' : 'clan invite'} link to a friend
						</p>
						<input
							type="text"
							className="w-full h-11 border-theme-primary text-theme-primary-active bg-theme-input rounded-lg px-[16px] py-[13px] text-[14px] outline-none"
							value={isInviteExternalCalling ? (props.privateRoomLink as string) : urlInvite}
							readOnly
						/>
						<button
							className="absolute right-0 bottom-0 mb-1  font-semibold text-sm px-8 py-1.5
							shadow outline-none focus:outline-none ease-linear transition-all duration-150
							btn-primary btn-primary-hover hover:opacity-80  text-[16px] leading-6 rounded-lg mr-[8px]"
							onClick={() => {
								handleCopyToClipboard(urlInvite);
								onClose();
								setShowClanListMenuContext?.();
							}}
						>
							Copy
						</button>
					</div>
					{!isInviteExternalCalling && (
						<p className="pt-1 text-[14px] mb-12px inline-flex gap-x-2">
							<span className="cursor-default text-theme-primary-active ">Your invite link expires in {expire} </span>
							<span className=" text-blue-600 cursor-pointer hover:underline" onClick={() => setModalEdit(true)}>
								Edit invite link.
							</span>
						</p>
					)}
				</div>
			</div>
		</ModalLayout>
	);
};

interface ModalGenerateLinkOptionProps {
	expire: string;
	setExpire: React.Dispatch<React.SetStateAction<string>>;
	closeModalEdit: () => void;
	max: string;
	setMax: React.Dispatch<React.SetStateAction<string>>;
}

const ModalGenerateLinkOption = ({ setExpire, expire, closeModalEdit, max, setMax }: ModalGenerateLinkOptionProps) => {
	return (
		<ModalLayout onClose={closeModalEdit}>
			<div className="bg-theme-setting-primary rounded-xl flex flex-col w-[480px] px-5 py-5 gap-2">
				<div className="space-y-2">
					<h3 className="text-xs font-bold text-theme-primary">Expire After</h3>
					<select
						name="expireAfter"
						className={`block w-full  border  rounded p-2 font-normal text-sm tracking-wide outline-none border-none`}
						onChange={(e) => {
							setExpire(e.target.value);
						}}
						value={expire}
					>
						{expireAfter.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-2">
					<h3 className="text-xs font-bold text-theme-primary">Max Number of Uses</h3>
					<select
						name="maxNumberofUses"
						className={`block w-full  rounded p-2 font-normal text-sm tracking-wide outline-none border-none `}
						onChange={(e) => {
							setMax(e.target.value);
						}}
						value={max}
					>
						{maxNumberofUses.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
				</div>
				<div className="flex justify-end gap-x-4">
					<button className="px-4 py-2 rounded-lg  border-theme-primary hover:bg-opacity-85" onClick={closeModalEdit}>
						Cancel
					</button>
					<button className="px-4 py-2 rounded-lg text-white bg-primary hover:bg-opacity-85" onClick={closeModalEdit}>
						Generate a New Link
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};
export default ModalInvite;
