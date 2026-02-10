import { Queue } from 'bullmq';
export function createAgentQueue(redisUrl) {
    return new Queue('agent-jobs', {
        connection: {
            url: redisUrl,
        },
    });
}
