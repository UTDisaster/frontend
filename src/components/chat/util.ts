const asDate = (value: Date | string): Date | null => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

export const formatMessageTime = (value: Date | string): string => {
    const date = asDate(value);
    if (!date) {
        return '--:--';
    }

    return new Intl.DateTimeFormat([], {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
};
