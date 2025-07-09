import { ArrowLeftIcon, FilterSearchIcon, IOption, IUerMention } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { DirectEntity } from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	NativeSyntheticEvent,
	Platform,
	Pressable,
	StatusBar,
	Text,
	TextInput,
	TextInputKeyPressEventData,
	TouchableOpacity,
	View
} from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import ListOptionSearch from '../ListOptionSearch';
import { style } from './InputSearchMessageChannel.styles';

type InputSearchMessageChannelProps = {
	onChangeText: (value: string) => void;
	onChangeOptionFilter: (option: IOption) => void;
	inputValue: string;
	userMention: IUerMention;
	currentChannel: IChannel | DirectEntity;
	optionFilter: IOption;
	onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
	nameChannel?: string;
};

const InputSearchMessageChannel = ({
	onChangeText,
	onChangeOptionFilter,
	inputValue,
	userMention,
	optionFilter,
	onKeyPress,
	nameChannel
}: InputSearchMessageChannelProps) => {
	const [textInput, setTextInput] = useState<string>(inputValue);
	const [isVisibleToolTip, setIsVisibleToolTip] = useState<boolean>(false);
	const inputSearchRef = useRef(null);
	const navigation = useNavigation<any>();
	const { t } = useTranslation(['searchMessageChannel']);

	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const shouldShowBadge = useMemo(
		() => nameChannel || optionFilter?.title || userMention?.display,
		[nameChannel, optionFilter?.title, userMention?.display]
	);

	const badgeText = useMemo(() => {
		if (optionFilter?.title || userMention?.display) {
			return `${optionFilter?.title || ''} ${userMention?.display || ''}`;
		}
		return `${t('in')} ${nameChannel || ''}`;
	}, [optionFilter?.title, userMention?.display, nameChannel]);

	const debouncedOnChangeText = useCallback(
		debounce((e) => {
			onChangeText(e);
		}, 300),
		[]
	);

	const handleTextChange = (e) => {
		setTextInput(e);
		debouncedOnChangeText(e);
		if (!e?.length) {
			onChangeOptionFilter(null);
		}
	};

	const clearTextInput = () => {
		setTextInput('');
		onChangeText('');
		onChangeOptionFilter(null);
	};

	useEffect(() => {
		if (optionFilter || userMention) {
			setTextInput(' ');
			onChangeText(' ');
		}
	}, [userMention, optionFilter]);

	const onGoBack = () => {
		navigation.goBack();
	};

	return (
		<View style={styles.wrapper}>
			<TouchableOpacity onPress={onGoBack} style={{ height: '100%', paddingRight: size.s_10 }}>
				<View style={{ alignSelf: 'center', justifyContent: 'center', flex: 1 }}>
					<ArrowLeftIcon width={20} height={20} color={Colors.textGray} />
				</View>
			</TouchableOpacity>
			<View style={styles.searchBox}>
				<View style={{ marginRight: size.s_6 }}>
					<MezonIconCDN icon={IconCDN.magnifyingIcon} width={20} height={20} color={Colors.textGray} />
				</View>
				{shouldShowBadge ? (
					<View
						style={{
							backgroundColor: themeValue.badgeHighlight,
							borderRadius: size.s_18,
							paddingHorizontal: size.s_10,
							paddingVertical: size.s_2,
							maxWidth: size.s_80
						}}
					>
						<Text numberOfLines={1} style={styles.textBadgeHighLight}>
							{badgeText}
						</Text>
					</View>
				) : null}
				<TextInput
					onKeyPress={onKeyPress}
					ref={inputSearchRef}
					value={textInput}
					onChangeText={handleTextChange}
					style={styles.input}
					placeholderTextColor={themeValue.text}
					placeholder={optionFilter?.title || userMention?.display ? '' : t('search')}
					autoFocus
				></TextInput>
				{textInput?.length ? (
					<Pressable onPress={() => clearTextInput()}>
						<MezonIconCDN icon={IconCDN.circleXIcon} height={18} width={18} color={themeValue.text} />
					</Pressable>
				) : null}
			</View>
			<Tooltip
				isVisible={isVisibleToolTip}
				closeOnBackgroundInteraction={true}
				disableShadow={true}
				closeOnContentInteraction={true}
				content={
					<ListOptionSearch
						onPressOption={(option) => {
							onChangeOptionFilter(option);
							if (inputSearchRef.current) {
								inputSearchRef.current.focus();
							}
							setIsVisibleToolTip(false);
						}}
					/>
				}
				contentStyle={{ minWidth: size.s_220, padding: 0, borderRadius: size.s_10, backgroundColor: Colors.primary }}
				arrowSize={{ width: 0, height: 0 }}
				placement="bottom"
				onClose={() => setIsVisibleToolTip(false)}
				showChildInTooltip={false}
				topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
			>
				<TouchableOpacity
					activeOpacity={0.7}
					onPress={() => {
						setIsVisibleToolTip(true);
						if (inputSearchRef.current) {
							inputSearchRef.current.focus();
						}
					}}
					style={styles.listSearchIcon}
				>
					<FilterSearchIcon width={20} height={20} color={themeValue.textStrong} />
				</TouchableOpacity>
			</Tooltip>
		</View>
	);
};

export default memo(InputSearchMessageChannel);
