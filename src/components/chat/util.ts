export const formatMessageTime = (date: Date) =>
    new Intl.DateTimeFormat([], {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
