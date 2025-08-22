export function createRippleEffect(element: HTMLElement, x: number, y: number) {
	const ripple = document.createElement('span');
	ripple.classList.add('ripple');
	element.appendChild(ripple);

	const { left, top, width, height } = element.getBoundingClientRect();
	const size = Math.max(width, height);

	ripple.style.width = ripple.style.height = `${size}px`;
	const rippleX = x - left - size / 2;
	const rippleY = y - top - size / 2;
	ripple.style.left = `${rippleX}px`;
	ripple.style.top = `${rippleY}px`;

	ripple.classList.add('animate');
	ripple.addEventListener('animationend', () => {
		ripple.remove();
	});
}

export default function ripple(node: HTMLElement, callback?: () => void) {
	const handleMouseDown = (event: MouseEvent) => {
		event.preventDefault();
		createRippleEffect(node, event.clientX, event.clientY);
		if (callback) callback();
	};

	node.addEventListener('mousedown', handleMouseDown);

	return {
		destroy() {
			node.removeEventListener('mousedown', handleMouseDown);
		}
	};
}
