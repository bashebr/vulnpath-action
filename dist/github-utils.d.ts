import { ScanResult } from './types';
export declare function postComment({ owner, repo, prNumber, githubToken, results }: {
    owner: string;
    repo: string;
    prNumber: number;
    githubToken: string;
    results: ScanResult;
}): Promise<void>;
