import re

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\Meetings.tsx', 'r', encoding='utf-8') as f:
    original = f.read()

start_match = re.search(r'export default function Meetings\(\{ pendingMeetCode \}: \{ pendingMeetCode\?: string \}\) \{', original)
end_match = re.search(r'    if \(!inMeeting\) \{', original)

if start_match and end_match:
    start_idx = start_match.end()
    end_idx = end_match.start()
    
    destructure_statement = '''
    const engine = useMeetingEngine(pendingMeetCode);
    const {
        activeSpeaker, addToast, analyserRef, audioAnimRef, audioContextRef, audioEnabled, audioLevel,
        availableDevices, backgroundBlur, blurFilterRef, broadcastMediaState, captionInterim, captionSpeaker,
        captionText, captionTimeoutRef, captionsEnabled, chatChannelRef, chatEndRef, chatFileInputRef,
        chatInput, chatMessages, compositeAnimRef, compositeCanvasRef, connectionQuality, containerRef,
        copied, copyMeetingLink, createPeerConnection, dbMeetingIdRef, fileInputRef, floatingReactions,
        generateMeetingId, handRaised, handleChatFileAttach, handleJoinMeeting, handleJoinWithPreviewCleanup,
        handleLeaveMeeting, handleScreenShare, handleSendChat, hasError, inMeeting, isFullscreen,
        isRecording, isUploading, krispFilterRef, lastConsumedCode, layout, liveKitRoomRef, localPeerId,
        localScreenStreamRef, localStreamRef, lowLightMode, mediaRecorderRef2, meetingFiles, meetingId,
        newPollOptions, newPollQuestion, newQuestionText, noiseSuppression, notesContent, polls, pollsTab,
        previewStream, previewVideoRef, questions, recognitionRef, recordedChunksRef, remoteAudioLevels,
        remotePeers, remotePeersRef, screenRef, screenShared, screenStream, selectedAudioIn, selectedBg,
        selectedVideoIn, setActiveSpeaker, setAudioEnabled, setAudioLevel, setAvailableDevices, setBackgroundBlur,
        setCaptionInterim, setCaptionSpeaker, setCaptionText, setCaptionsEnabled, setChatInput, setChatMessages,
        setConnectionQuality, setCopied, setFloatingReactions, setHandRaised, setHasError, setInMeeting,
        setIsFullscreen, setIsRecording, setIsUploading, setLayout, setLowLightMode, setMeetingFiles,
        setMeetingId, setNewPollOptions, setNewPollQuestion, setNewQuestionText, setNoiseSuppression,
        setNotesContent, setPolls, setPollsTab, setPreviewStream, setQuestions, setRemoteAudioLevels,
        setRemotePeers, setScreenShared, setScreenStream, setSelectedAudioIn, setSelectedBg, setSelectedVideoIn,
        setShowDeviceSelector, setShowMobileMore, setShowPollCreator, setShowReactionTray, setShowSidebar,
        setSpeechSupported, setStream, setStudioLighting, setToasts, setValidatedMeeting, setVideoEnabled,
        setupSignaling, shareMeetingToChat, showDeviceSelector, showMobileMore, showPollCreator, showReactionTray,
        showSidebar, signalingChannelRef, speechSupported, stream, studioLighting, toasts, toggleFullscreen,
        toggleHandRaise, togglePiP, toggleRecording, updatePeer, userAvatar, userName, validateMeetingCode,
        validatedMeeting, videoEnabled, videoRef, virtualBgFilterRef
    } = engine;
'''
    
    new_content = original[:start_idx] + destructure_statement + original[end_idx:]
    
    new_content = "import { useMeetingEngine } from './meetings/useMeetingEngine';\n" + new_content
    
    with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\Meetings.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print('Success')
