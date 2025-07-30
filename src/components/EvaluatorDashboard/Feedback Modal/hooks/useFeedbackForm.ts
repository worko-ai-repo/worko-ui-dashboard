import { useState } from 'react';

export interface ScheduledSlot {
        availability: 1 | 2 | 3;
        date: string;
        duration: string;
        timeSlot: string;
        startTime: number;
        endTime: number;
    }

export const useFeedbackForm = () => {
    const [score, setScore] = useState(2.5);
    const [feedback, setFeedback] = useState('');
    const [nextStep, setNextStep] = useState<'schedule' | 'reject' | 'hold' | null>(null);
    const [showNextStepDetails, setShowNextStepDetails] = useState(false);

    const [availabilityIndex, setAvailabilityIndex] = useState<1 | 2 | 3>(1);

    const [scheduledSlots, setScheduledSlots] = useState<ScheduledSlot[]>([
        {
            availability: 1,
            date: new Date().toISOString().split('T')[0],
            duration: '30 mins',
            timeSlot: '',
            startTime: 12,
            endTime: 12.5,
        },
        {
            availability: 2,
            date: new Date().toISOString().split('T')[0],
            duration: '30 mins',
            timeSlot: '',
            startTime: 12,
            endTime: 12.5,
        },
        {
            availability: 3,
            date: new Date().toISOString().split('T')[0],
            duration: '30 mins',
            timeSlot: '',
            startTime: 12,
            endTime: 12.5,
        },
    ]);


    // Rejection States
    const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
    const [isRejectionDropdownOpen, setIsRejectionDropdownOpen] = useState(false);

    // On Hold States
    const [selectedHoldReason, setSelectedHoldReason] = useState<string>('');
    const [isHoldDropdownOpen, setIsHoldDropdownOpen] = useState(false);

    // Comment Fields (shared between Reject and Hold)
    const [comment, setComment] = useState('');
    const [htmlComment, setHtmlComment] = useState('');

    const formatTime = (time: number) => {
        const hours = Math.floor(time);
        const minutes = (time % 1) * 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getDateSuffix = (date: number) => {
        if (date === 1) return 'st';
        if (date === 2) return 'nd';
        if (date === 3) return 'rd';
        return 'th';
    };

    // const handleTimeSliderChange = (value: number) => {
    //     setStartTime(value);
    //     const durationHours = selectedDuration === '30 mins' ? 0.5 :
    //         selectedDuration === '45 mins' ? 0.75 :
    //             selectedDuration === '1 hour' ? 1 : 1.5;
    //     setEndTime(value + durationHours);
    //     setSelectedTimeSlot(`From ${formatTime(value)} to ${formatTime(value + durationHours)}`);
    // };

    const updateScheduledSlot = (index: number, updatedSlot: ScheduledSlot) => {
        setScheduledSlots(prev => {
            const newSlots = [...prev];
            newSlots[index] = updatedSlot;
            return newSlots;
        });
    };


    const handleNextStepClick = (step: 'schedule' | 'reject' | 'hold') => {
        setNextStep(nextStep === step ? null : step);
    };

    const isInitialFormValid = score > 0 && feedback.trim() && nextStep;

    const isNextStepValid = () => {
        if (nextStep === 'schedule') {
            return scheduledSlots.some(slot => slot.timeSlot && slot.date);
        } else if (nextStep === 'reject') {
            return !!selectedRejectionReason && !!comment.trim();
        } else if (nextStep === 'hold') {
            return !!selectedHoldReason && !!comment.trim();
        }
        return false;
    };

    return {
        // Basic form state
        score,
        setScore,
        feedback,
        setFeedback,
        nextStep,
        setNextStep,
        showNextStepDetails,
        setShowNextStepDetails,

        // Rejection states
        selectedRejectionReason,
        setSelectedRejectionReason,
        isRejectionDropdownOpen,
        setIsRejectionDropdownOpen,

        // Hold states
        selectedHoldReason,
        setSelectedHoldReason,
        isHoldDropdownOpen,
        setIsHoldDropdownOpen,

        // Comment fields
        comment,
        setComment,
        htmlComment,
        setHtmlComment,

        // Helper functions
        formatTime,
        getDateSuffix,
        handleNextStepClick,
        isInitialFormValid,
        isNextStepValid,

        scheduledSlots,
        availabilityIndex,
        setAvailabilityIndex,
        updateScheduledSlot,
    };
};