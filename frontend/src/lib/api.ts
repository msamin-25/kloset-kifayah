import axios from 'axios';
import type { Listing, PaginatedResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface ListingSearchParams {
    query?: string;
    category?: string;
    is_modest?: boolean;
    location?: string;
    min_price?: number;
    max_price?: number;
    page?: number;
    per_page?: number;
}

export async function getListings(params: ListingSearchParams = {}): Promise<PaginatedResponse<Listing>> {
    const response = await api.get('/listings', { params });
    return response.data;
}

export async function getListing(id: string): Promise<Listing> {
    const response = await api.get(`/listings/${id}`);
    return response.data;
}

export async function createListing(data: Partial<Listing>, token: string): Promise<Listing> {
    const response = await api.post('/listings', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export default api;
