import { generateClanWebhook, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import { ApiClanWebhook, ApiGenerateClanWebhookRequest } from 'mezon-js/api.gen';
import { useSelector } from 'react-redux';
import ClanWebhookItemModal from './ClanWebhookItemModal';

interface IClanWebhooksProps {
	allClanWebhooks?: ApiClanWebhook[] | undefined;
}

const ClanWebhooks = ({ allClanWebhooks }: IClanWebhooksProps) => {
	const dispatch = useAppDispatch();
	const webhookNames = ['Captain hook', 'Spidey bot', 'Komu Knight'];
	const getRandomWebhookName = (): string => {
		const randomIndex = Math.floor(Math.random() * webhookNames.length);
		return webhookNames[randomIndex];
	};

	const webHookAvatars = [
		`${process.env.NX_BASE_IMG_URL}/1787707828677382144/1791037204600983552/1787691797724532700/211_0mezon_logo_white.png`,
		`${process.env.NX_BASE_IMG_URL}/1787707828677382144/1791037204600983552/1787691797724532700/211_1mezon_logo_black.png`,
		`${process.env.NX_BASE_IMG_URL}/0/1833395573034586112/1787375123666309000/955_0mezon_logo.png`
	];

	const getRandomAvatar = (): string => {
		const randomIndex = Math.floor(Math.random() * webHookAvatars.length);
		return webHookAvatars[randomIndex];
	};
	const clanId = useSelector(selectCurrentClanId) as string;
	const handleAddWebhook = () => {
		const newWebhookReq: ApiGenerateClanWebhookRequest = {
			webhook_name: getRandomWebhookName(),
			avatar: getRandomAvatar(),
			clan_id: clanId
		};
		dispatch(generateClanWebhook({ request: newWebhookReq, clanId: clanId }));
	};

	return (
		<div className="pb-5">
			<div className=" text-sm pt-5 flex flex-col text-theme-primary">
				<span className="font-semibold">
					Clan Webhooks are a simple way to post messages from other apps and websites for each Mezon user using internet technology.
				</span>
				<span className="font-semibold text-[#00a8fc]">
					Tip: If you feel the token on your URL is compromised or outdated, reset it and copy the new URL.
				</span>
			</div>
			<div className="border-b-theme-primary my-[32px]" />
			{allClanWebhooks?.length !== 0 ? (
				<>
					<div
						onClick={handleAddWebhook}
						className="py-2 px-4 btn-primary btn-primary-hover rounded-lg mb-[24px] w-fit text-[14px] font-semibold cursor-pointer "
					>
						New Clan Webhook
					</div>
					{allClanWebhooks && allClanWebhooks.map((webhook) => <ClanWebhookItemModal webhookItem={webhook} key={webhook.id} />)}
				</>
			) : (
				<div className="flex items-center flex-col gap-4">
					<Image src={`assets/images/empty-webhook.svg`} width={48} height={48} className="clan object-cover w-[272px]" />
					<div className="font-medium ">You have no webhooks!</div>
					<div
						onClick={handleAddWebhook}
							className="py-2 px-4 btn-primary btn-primary-hover rounded-lg mb-[24px] w-fit text-[14px] font-semibold cursor-pointer "
					>
						New Clan Webhook
					</div>
				</div>
			)}
		</div>
	);
};

export default ClanWebhooks;
