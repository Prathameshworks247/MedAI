import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface ReasoningNode {
    id: string;
    label: string;
    type: "input" | "process" | "output" | "evidence";
    icon: string;
}

interface ReasoningConnection {
    from: string;
    to: string;
    label?: string;
}

interface ClinicalReasoningFlowProps {
    nodes: ReasoningNode[];
    connections: ReasoningConnection[];
}

export function ClinicalReasoningFlow({ nodes, connections }: ClinicalReasoningFlowProps) {
    const getNodeStyle = (type: ReasoningNode["type"]) => {
        switch (type) {
            case "input":
                return "bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300";
            case "output":
                return "bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-300";
            case "evidence":
                return "bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-300";
            case "process":
                return "bg-purple-50/50 border-purple-200 text-purple-700 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-300";
            default:
                return "bg-secondary border-border text-secondary-foreground";
        }
    };

    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 100; // Estimated height for layout calculations
    const GAP_X = 40;
    const GAP_Y = 120;

    // Compute layout with memoization
    const { layoutNodes, edges, containerHeight, containerWidth } = useMemo(() => {
        if (!nodes.length) return { layoutNodes: [], edges: [], containerHeight: 0, containerWidth: 0 };

        // 1. Calculate levels (depth from roots)
        const getDepth = (nodeId: string, visited = new Set<string>()): number => {
            if (visited.has(nodeId)) return 0;
            visited.add(nodeId);

            const incoming = connections.filter(c => c.to === nodeId);
            if (incoming.length === 0) return 0;

            const parentDepths = incoming.map(c => getDepth(c.from, new Set(visited)));
            return Math.max(...parentDepths) + 1;
        };

        const nodesWithLevels = nodes.map(n => ({
            ...n,
            level: getDepth(n.id)
        }));

        type NodeWithLevel = typeof nodesWithLevels[number];

        const maxLevel = Math.max(...nodesWithLevels.map(n => n.level));
        const levelGroups = Array.from({ length: maxLevel + 1 }, () => [] as NodeWithLevel[]);

        nodesWithLevels.forEach(n => {
            levelGroups[n.level].push(n);
        });

        // 2. Assign positions
        const finalNodes: (NodeWithLevel & { x: number; y: number })[] = [];

        // Calculate max width required
        const maxNodesInLevel = Math.max(...levelGroups.map(g => g.length));
        const totalMaxWidth = maxNodesInLevel * (NODE_WIDTH + GAP_X) - GAP_X;

        levelGroups.forEach((group, levelIndex) => {
            const groupWidth = group.length * (NODE_WIDTH + GAP_X) - GAP_X;
            // Center the group in the container
            const startX = (totalMaxWidth - groupWidth) / 2;

            group.forEach((node, nodeIndex) => {
                finalNodes.push({
                    ...node,
                    x: startX + nodeIndex * (NODE_WIDTH + GAP_X),
                    y: levelIndex * GAP_Y + 40 // +40 padding top
                });
            });
        });

        // 3. Edges with coordinates
        const finalEdges = connections.map(conn => {
            const startNode = finalNodes.find(n => n.id === conn.from);
            const endNode = finalNodes.find(n => n.id === conn.to);
            if (!startNode || !endNode) return null;

            return {
                ...conn,
                startX: startNode.x + NODE_WIDTH / 2,
                startY: startNode.y + NODE_HEIGHT - 20, // Approximate bottom
                endX: endNode.x + NODE_WIDTH / 2,
                endY: endNode.y + 10 // Approximate top
            };
        }).filter(Boolean) as any[];

        return {
            layoutNodes: finalNodes,
            edges: finalEdges,
            containerHeight: (maxLevel + 1) * GAP_Y + 100,
            containerWidth: totalMaxWidth + GAP_X // Add some padding
        };
    }, [nodes, connections]);

    if (nodes.length === 0) {
        return (
            <div className="bg-card rounded-xl shadow-sm border p-6 min-h-[200px] flex items-center justify-center text-muted-foreground">
                No clinical flow data available
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl shadow-lg border relative overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center gap-2 sticky top-0 z-20 backdrop-blur-sm">
                <span className="text-xl">🧠</span>
                <h3 className="font-bold text-lg">Clinical Reasoning Chain</h3>
            </div>

            <div
                className="relative overflow-x-auto custom-scrollbar"
                style={{ height: Math.max(500, containerHeight) }}
            >
                <div
                    className="relative text-left mx-auto"
                    style={{ width: Math.max(containerWidth + 100, 800), height: containerHeight }}
                >
                    {/* SVG Layer for Connections */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground/50" />
                            </marker>
                        </defs>
                        {edges.map((edge, idx) => {
                            const dy = edge.endY - edge.startY;
                            const dx = edge.endX - edge.startX;

                            // Curve logic
                            const controlPointY1 = edge.startY + dy * 0.5;
                            const controlPointY2 = edge.endY - dy * 0.5;

                            const path = `M ${edge.startX} ${edge.startY} 
                           C ${edge.startX} ${controlPointY1}, 
                             ${edge.endX} ${controlPointY2}, 
                             ${edge.endX} ${edge.endY}`;

                            return (
                                <motion.g
                                    key={`${edge.from}-${edge.to}`}
                                    initial={{ opacity: 0, pathLength: 0 }}
                                    animate={{ opacity: 1, pathLength: 1 }}
                                    transition={{ duration: 0.8, delay: 0.5 + idx * 0.05 }}
                                >
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-muted-foreground/30"
                                        markerEnd="url(#arrowhead)"
                                    />
                                </motion.g>
                            );
                        })}
                    </svg>

                    {/* Nodes Layer */}
                    {layoutNodes.map((node, idx) => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                                position: 'absolute',
                                left: node.x,
                                top: node.y,
                                width: NODE_WIDTH,
                            }}
                            className={`
                rounded-lg border shadow-sm p-3 z-10 backdrop-blur-md
                transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                ${getNodeStyle(node.type)}
              `}
                        >
                            <div className="flex flex-col h-full gap-2">
                                <div className="flex items-center gap-2 border-b border-black/5 pb-2 mb-1">
                                    <span className="text-lg">{node.icon}</span>
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider opacity-80 truncate" title={node.id}>
                                        {node.id.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="text-sm font-medium leading-snug opacity-90">
                                    {node.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

