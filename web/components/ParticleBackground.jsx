'use client';

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticleBackground() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const options = useMemo(
        () => ({
            background: {
                color: {
                    value: "#000000", // Transparent to let parent BG show, or solid black
                },
                opacity: 0,
            },
            fpsLimit: 60, // Limit FPS to save battery
            interactivity: {
                events: {
                    onClick: { enable: true, mode: "push" },
                    onHover: { enable: true, mode: "grab" },
                    resize: true,
                },
                modes: {
                    push: { quantity: 4 },
                    grab: { distance: 140, links: { opacity: 1 } },
                },
            },
            particles: {
                color: { value: ["#a855f7", "#06b6d4"] },
                links: {
                    color: "#4b5563",
                    distance: 150,
                    enable: true,
                    opacity: 0.2,
                    width: 1,
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: { default: "bounce" },
                    random: false,
                    speed: 1,
                    straight: false,
                },
                number: {
                    density: { enable: true, area: 800 },
                    value: 80, // Reduced from 100
                },
                opacity: { value: 0.5 },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 3 } },
            },
            // Responsive optimization
            responsive: [
                {
                    maxWidth: 768, // On Mobile
                    options: {
                        particles: {
                            number: { value: 20 }, // Very few particles
                            links: { enable: false }, // NO connections (heavy CPU usage)
                            move: { speed: 0.5 }, // Slower movement
                        },
                        interactivity: {
                            events: { onHover: { enable: false } } // Disable hover interaction
                        }
                    }
                }
            ],
            detectRetina: true,
        }),
        [],
    );

    if (init) {
        return (
            <Particles
                id="tsparticles"
                particlesLoaded={null}
                options={options}
                className="absolute inset-0 z-0"
            />
        );
    }

    return null;
}
