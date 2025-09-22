/* eslint-disable no-console */
import { MediaStream, RTCPeerConnection, RTCSessionDescription } from '@livekit/react-native-webrtc';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface WebRTCContextType {
	isSupported: boolean;
	isConnected: boolean;
	connectionState: RTCIceConnectionState;
	connect: () => Promise<void>;
	disconnect: () => void;
	sendMessage: (message: Record<string, unknown>) => void;
	errors: string[];
	messages: string[];
	handleChannelClick: (clanId: string, channelId: string, userId: string, streamId: string, username: string, accessToken?: string) => void;
	remoteStream: MediaStream;
	isStream: boolean;
	isRemoteVideoStream: boolean;
}

interface WebRTCProviderProps {
	children: React.ReactNode;
}

const WebRTCStreamContext = createContext<WebRTCContextType | null>(null);

export const WebRTCStreamProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
	const [isSupported, setIsSupported] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionState, setConnectionState] = useState<RTCIceConnectionState>('new');
	const [errors, setErrors] = useState<string[]>([]);
	const [messages, setMessages] = useState<string[]>([]);
	const [remoteStream, setRemoteStream] = useState<MediaStream>(null);
	const [isRemoteVideoStream, setIsRemoteVideoStream] = useState(false);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const wsRef = useRef<any | null>(null);
	const [isStream, setIsStream] = useState(false);

	const debug = useCallback((...args: string[]) => {
		addMessage(args.join(' '));
	}, []);

	const addError = useCallback((...msgs: string[]) => {
		setErrors((prev) => [...prev, ...msgs]);
	}, []);

	const addMessage = useCallback((message: string) => {
		const timestamp = new Date().toISOString();
		setMessages((prev) => [`${timestamp} ${message}`, ...prev]);
	}, []);

	useEffect(() => {
		const checkSupport = () => {
			const supported = !!(
				navigator.mediaDevices?.getUserMedia ||
				(navigator as any).webkitGetUserMedia ||
				(navigator as any).mozGetUserMedia ||
				(navigator as any).msGetUserMedia ||
				RTCPeerConnection
			);
			setIsSupported(supported);

			if (!supported) {
				addError('WebRTC is not supported in your browser');
			}
		};
		checkSupport();
	}, [addError]);

	// WebSocket handling
	const wsSend = useCallback(
		(message: Record<string, unknown>) => {
			const jsonStr = JSON.stringify(message);
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(jsonStr);
			} else {
				addError('ws: send not ready, skipping...');
			}
		},
		[wsRef.current, debug]
	);

	// RTCPeerConnection handling
	const initPeerConnection = useCallback(() => {
		const peerConnection = new RTCPeerConnection({
			iceServers: [
				{
					urls: 'stun:stun.l.google.com:19302'
				}
			]
		});

		peerConnection.addEventListener('iceconnectionstatechange', (event) => {
			setConnectionState(peerConnection.iceConnectionState);
			setIsConnected(peerConnection.iceConnectionState === 'connected');
		});

		peerConnection.addEventListener('icecandidate', (event) => {
			if (event.candidate && event.candidate.candidate !== '') {
				const message = {
					Key: 'ice_candidate',
					Value: event.candidate
				};
				wsSend(message);
			}
		});

		peerConnection.addEventListener('track', (event) => {
			if (!event?.streams || !Array.isArray(event.streams) || event.streams.length === 0) {
				console.error('Invalid event streams in track listener');
				return;
			}

			const remoteStream = event.streams[0];
			if (!remoteStream) {
				console.error('No remote stream available in first position');
				return;
			}

			const newStream = new MediaStream();
			remoteStream.getTracks().forEach((track) => {
				newStream.addTrack(track);
			});

			setRemoteStream(newStream);

			const videoTracks = remoteStream.getVideoTracks();
			if (videoTracks && videoTracks.length > 0) {
				videoTracks.forEach((track) => {
					track.addEventListener('mute', () => {
						setIsRemoteVideoStream(true);
					});
					track.addEventListener('unmute', () => {
						setIsRemoteVideoStream(true);
					});
				});
			}

			const audioTracks = remoteStream.getAudioTracks();
			if (audioTracks && audioTracks.length > 0) {
				audioTracks.forEach((track) => {
					track.addEventListener('mute', () => {
						setIsRemoteVideoStream(false);
					});
					track.addEventListener('unmute', () => {
						setIsRemoteVideoStream(false);
					});
				});
			}
		});

		peerConnection.addTransceiver('audio', {});

		pcRef.current = peerConnection;

		return peerConnection;
	}, [wsSend, debug]);

	const startSession = useCallback(
		(sd: string) => {
			if (pcRef.current && pcRef.current.connectionState !== 'closed') {
				try {
					pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sd }));
				} catch (e) {
					alert(e);
				}
			}
		},
		[pcRef.current]
	);

	const connect = useCallback(async () => {
		if (!isSupported) {
			throw new Error('WebRTC is not supported');
		}

		const peerConnection = pcRef.current || initPeerConnection();

		try {
			const offer = await peerConnection.createOffer({});
			await peerConnection.setLocalDescription(offer);

			wsSend({
				Key: 'offer',
				Value: offer
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error during connection';
			addError(errorMessage);
			throw error;
		}
	}, [pcRef.current, wsSend, isSupported, initPeerConnection, addError]);

	const disconnect = useCallback(() => {
		// Cleanup WebSocket
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		// Cleanup PeerConnection
		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}

		// Reset all states
		setIsConnected(false);
		setConnectionState('closed');
		setIsStream(false);
		setRemoteStream(null);
		setIsRemoteVideoStream(false);
		setErrors([]);
		setMessages([]);
	}, []);
	const handleChannelClick = useCallback(
		(clanId: string, channelId: string, userId: string, streamId: string, username: string, accessToken: string) => {
			const wsUrl = process.env.NX_CHAT_APP_STREAM_WS_URL;
			const websocket = new WebSocket(`${wsUrl}/ws?username=${username}&token=${accessToken}`);
			try {
				const peerConnection = initPeerConnection();
				websocket.onopen = () => {
					const f = () => {
						// Check if peerConnection is still valid before creating offer
						if (!peerConnection || peerConnection.connectionState === 'closed') {
							console.error('PeerConnection is not available or closed');
							return;
						}

						peerConnection
							?.createOffer({})
							.then((d) => {
								peerConnection?.setLocalDescription(d);
								websocket.send(
									JSON.stringify({
										Key: 'session_subscriber',
										ClanId: clanId,
										ChannelId: channelId,
										UserId: userId,
										Value: d
									})
								);

								websocket.send(
									JSON.stringify({
										Key: 'get_channels'
									})
								);
							})
							.catch((e) => {
								console.log(e, 'error');
							});
					};
					websocket.readyState === WebSocket.OPEN ? f() : websocket.addEventListener('open', f);
				};

				websocket.onmessage = (event) => {
					try {
						if (!event?.data || typeof event.data !== 'string') {
							console.error('Invalid websocket event data');
							return;
						}

						const data = JSON.parse(event.data);

						if (!data || typeof data !== 'object' || !('Key' in data)) {
							console.error('Invalid websocket message format');
							return;
						}

						switch (data.Key) {
							case 'channels':
								if (Array.isArray(data.Value) && data.Value.includes(streamId)) {
									websocket.send(
										JSON.stringify({
											Key: 'connect_subscriber',
											ClanId: clanId,
											ChannelId: channelId,
											UserId: userId,
											Value: { ChannelId: streamId }
										})
									);
									setIsStream(true);
								} else {
									setIsStream(false);
								}
								break;
							case 'session_received':
								break;
							case 'error':
								console.error('WebSocket error:', data.Value);
								break;
							case 'sd_answer':
								if (data.Value && typeof data.Value === 'string') {
									startSession(data.Value);
								}
								break;
							case 'ice_candidate':
								if (data.Value && pcRef.current && pcRef.current.connectionState !== 'closed') {
									pcRef.current.addIceCandidate(data.Value).catch((error) => {
										console.error('Error adding ICE candidate:', error);
									});
								}
								break;
							default:
								console.log('Unhandled message:', data);
						}
					} catch (error) {
						console.error('Error parsing websocket message:', error, event.data);
					}
				};

				websocket.onerror = (error) => {
					console.log(error, 'error');
				};

				wsRef.current = websocket;
			} catch (error) {
				console.log(error, 'error');
			}
		},
		[]
	);

	const value = {
		isSupported,
		isConnected,
		connectionState,
		connect,
		disconnect,
		sendMessage: wsSend,
		errors,
		messages,
		handleChannelClick,
		isRemoteVideoStream,
		remoteStream,
		isStream
	};

	return <WebRTCStreamContext.Provider value={value}>{children}</WebRTCStreamContext.Provider>;
};

export const useWebRTCStream = () => {
	const context = useContext(WebRTCStreamContext);
	if (!context) {
		throw new Error('useWebRTC must be used within a WebRTCProvider');
	}
	return context;
};
