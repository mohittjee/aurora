"use client";

import * as React from "react";
import {
    motion,
    useMotionValue,
    useMotionTemplate,
    HTMLMotionProps,
} from "motion/react";

interface HoverGradientBorderProps extends HTMLMotionProps<"div"> {
    radius?: number;
    className?: string;
    children: React.ReactNode;
}

export const HoverGradientBorder: React.FC<HoverGradientBorderProps> = ({
    radius = 100,
    className = "",
    children,
    ...props
}) => {
    const [isClient, setIsClient] = React.useState(false);

    // Fix hydration error: only run on client
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const [visible, setVisible] = React.useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    if (!isClient) {
        return (
            <div className={`transition duration-300 ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={{
                background: useMotionTemplate`
          radial-gradient(
            ${visible ? `${radius}px` : "0px"} circle at ${mouseX}px ${mouseY}px,
            #3b82f6,
            transparent 80%
          )
        `,
            }}
            className={`transition duration-300 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};
