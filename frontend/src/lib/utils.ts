export const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update hash without jumping
        window.history.pushState(null, '', `#${id}`);
    }
};
