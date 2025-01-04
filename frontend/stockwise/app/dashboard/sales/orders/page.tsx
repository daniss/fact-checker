'use client'

import { useState, useEffect } from 'react';
import { Table } from '@/components/shared/Table';
import { Modal } from '@/components/shared/Modal';
import { Product, saleItem, saleItemAdd, Supplier } from '@/lib/types';
import { JSX } from 'react';
import axios from 'axios';
import apiClient from '@/app/axios';

type Column<T> = {
    key: keyof T;
    title: string;
    render?: (item: T) => JSX.Element | string;
};

const saleColumns: Column<saleItem>[] = [
    { key: 'customerName', title: 'Name', render: (item: saleItem) => item.customerName },
    { key: 'quantity', title: 'Quantity' },
    { key: 'category', title: 'Category', render: (item: saleItem) => item.product_id.category },
    {
        key: 'status',
        title: 'Status',
        render: (item: saleItem) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${item.quantity > 0 ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'}`}>
                {item.quantity > 0 ? 'IN sale' : 'LOW sale'}
            </span>
        )
    },
    {
        key: 'supplier_id',
        title: 'Supplier',
        render: (item: saleItem) => item.supplier_id?.name || 'N/A'
    },
    // {
    //     key: 'price',
    //     title: 'Price',
    //     render: (item: saleItem) => `$${item.price.toFixed(2)}`
    // }
];

export default function OrderPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<saleItem | null>(null);
    const [newItem, setNewItem] = useState<Product>();
    const [saleItems, setsaleItems] = useState<saleItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [showProductForm, setShowProductForm] = useState(false);
    const [newProductName, setNewProductName] = useState<string>('');


    const [newsaleItemQuantity, setNewsaleItemQuantity] = useState<number>(0);

    const [listSuppliers, setListSuppliers] = useState<Supplier[]>([]);

    
    const handleAddProduct = async () => {
        if (!newProductName) return;
        try {
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            const response = await axios.post('http://localhost:8080/product', {
                name: newProductName,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setProducts((prevProducts) => [...prevProducts, response.data]); // Update product list
            setShowProductForm(false); // Close the form
            setNewProductName(''); // Reset input
        } catch (error) {
            console.error('Error adding new product:', error);
        }
    };


    useEffect(() => {
        const fetchsaleItems = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
                const response = await axios.get('http://localhost:8080/inventory',  { 
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                 });
                setsaleItems(response.data);
                console.log('sale items:', response.data);
            } catch (error) {
                console.error('Error fetchinsg sale items:', error);
            }
        };
        const fetchProducts = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
                const response = await axios.get('http://localhost:8080/product', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setProducts(response.data);
                console.log('Products:', response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        }
        const fetchSuppliers = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
                const response = await axios.get('http://localhost:8080/supplier', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setListSuppliers(response.data);
                console.log('Suppliers:', response.data);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        }
        
        fetchSuppliers();
        fetchProducts();
        fetchsaleItems();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            await axios.delete(`http://localhost:8080/inventory/product/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setsaleItems((prevItems) => prevItems.filter((item) => item.id !== id));
            setSelectedItem(null);
        } catch (error) {
            console.error('Error deleting sale item:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Sale Management</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    Add sale Item
                </button>
            </div>

            {/* <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Filter by Product Name</label>
                <input
                    type="text"
                    placeholder="Enter product name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    onChange={(e) => {
                        const filteredItems = saleItems.filter(item =>
                            item.product_id.name.toLowerCase().includes(e.target.value.toLowerCase())
                        );
                        setsaleItems(filteredItems);
                    }}
                />
            </div> */}
            <Table
                data={saleItems}
                columns={saleColumns}
                onRowClick={(item) => setSelectedItem(item)}
            />

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add sale Item"
            >
                <div>{/* Add form implementation here */}</div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!newItem) {
                            return;
                        }
                        const newsaleItem: saleItemAdd = { product_id: newItem.id, quantity: newsaleItemQuantity, supplier_id: 1, threshold: 0, organization_id: 1 };
                        console.log('Adding item:', newsaleItem);
                        
                        const addsaleItem = async () => {
                            try {
                                const response = await apiClient.post('/inventory/product', newsaleItem);
                                setsaleItems((prevItems) => [...prevItems, response.data]);
                                setIsAddModalOpen(false);
                            } catch (error) {
                                console.error('Error adding sale item:', error);
                            }
                        };

                        addsaleItem();
                    }}
                >
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e) => {
                                const selectedProduct = products.find(product => product.name === e.target.value);
                                setNewItem(selectedProduct);
                            }}
                        >
                            <option value="">Select a product</option>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <option key={product.id} value={product.name}>
                                        {product.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    No products available
                                </option>
                            )}
                        </select>
                    {/* Add New Product Option */}
                        {!showProductForm ? (
                            <button
                                type="button"
                                onClick={() => setShowProductForm(true)}
                                className="mt-2 text-indigo-600 hover:underline"
                            >
                                + Add New Product
                            </button>
                        ) : (
                            <div className="mt-2 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Product Name"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">Select a supplier</option>
                                    {listSuppliers.length > 0 ? (
                                        listSuppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.name}>
                                                {supplier.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>
                                            No suppliers available
                                        </option>
                                    )}
                                </select>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={handleAddProduct}
                                        className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                                    >
                                        Save Product
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowProductForm(false)}
                                        className="text-gray-600 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            placeholder="Quantity"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e) => {
                                setNewsaleItemQuantity(Number(e.target.value));
                            }}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e) => {
                                const selectedSupplier = listSuppliers.find(supplier => supplier.name === e.target.value);
                                setNewItem({ ...newItem, supplier_id: selectedSupplier } as Product);
                            }}
                        >
                            <option value="">Select a supplier</option>
                            {listSuppliers.length > 0 ? (
                                listSuppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.name}>
                                        {supplier.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    No suppliers available
                                </option>
                            )}
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title="Edit sale Item"
            >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Saving item:', selectedItem);
                    const updatesaleItem = async () => {
                        try {
                            await axios.put(`http://localhost:8080/inventory/product/${selectedItem?.id}`, selectedItem);
                            setsaleItems((prevItems) =>
                                prevItems.map((item) => (item.id === selectedItem?.id ? selectedItem! : item))
                            );
                            setSelectedItem(null);
                        } catch (error) {
                            console.error('Error updating sale item:', error);
                        }
                    };

                    updatesaleItem();
                }}
            >
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input
                        type="text"
                        value={selectedItem?.product_id.name}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                        type="number"
                        value={selectedItem?.quantity}
                        onChange={(e) => setSelectedItem({ ...selectedItem, quantity: Number(e.target.value) } as saleItem)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                        value={selectedItem?.supplier_id?.name || ''}
                        onChange={(e) => {
                            const selectedSupplier = listSuppliers.find(supplier => supplier.name === e.target.value);
                            setSelectedItem({ ...selectedItem, supplier_id: selectedSupplier } as saleItem);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">Select a supplier</option>
                        {listSuppliers.length > 0 ? (
                            listSuppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.name}>
                                    {supplier.name}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>
                                No suppliers available
                            </option>
                        )}
                    </select>
                </div>
                <div className="flex justify-end">
                    <button 
                        type="button"
                        className="bg-red-600 text-white px-4 mx-2 py-2 rounded-lg hover:bg-red-700"
                        onClick={() => handleDelete(selectedItem?.id!)}
                    >
                        Delete
                    </button>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        Save
                    </button>
                </div>
            </form>
            </Modal>
        </div>
    );
}
