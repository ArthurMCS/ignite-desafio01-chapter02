import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = JSON.parse(localStorage.getItem('@RocketShoes:cart') || '[]')

    return storagedCart;
  });

  const addProduct = async (productId: number) => {
    try {
     const updatedCart = [...cart] 
     const productExists = updatedCart.find(p => p.id === productId);

     const stock = await api.get(`stock/${productId}`);

  
     const stockAmount = stock.data.amount;
     const currentAmount = productExists ? productExists.amount : 0;

     const amount = currentAmount + 1;

     if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
     }

     if(productExists){
        productExists.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`);
        const newproduct = {
          ...product.data,
          amount: 1,
        }
        updatedCart.push(newproduct);
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } catch {
        toast.error('Erro na adição do produto');
      }
  };

  const removeProduct = (productId: number) => {
    try {
      if(!cart.find(product => product.id === productId)) {
        throw Error();
      }
      const newCart = cart.filter(product => product.id !== productId)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;

      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      if(productExists){
        productExists.amount = amount
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
