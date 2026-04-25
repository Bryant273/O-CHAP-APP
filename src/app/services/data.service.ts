import { Injectable, signal, computed } from '@angular/core';
import { 
  db 
} from './firebase';
import { 
  collection, 
  doc, 
  updateDoc,
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  runTransaction,
  QuerySnapshot,
  DocumentData,
  Transaction,
  getDocFromServer,
  getDocs,
  getDoc,
  addDoc,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface OchapUser {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  role: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  createdAt?: unknown;
  status?: string;
  productCount?: number;
  [key: string]: unknown;
}

export interface OchapOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
}

export interface OchapProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  unit?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  supplierId?: string;
  brand?: string;
  threshold?: number;
  rating?: number;
  reviewCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  supplierName?: string;
  stockLevel?: number;
  stockUnit?: string;
  technicalSpecs?: string;
  [key: string]: unknown;
}

export interface OchapOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerUid?: string;
  supplierId?: string;
  items: unknown[];
  total: number;
  totalAmount?: number;
  status: string;
  createdAt: unknown;
  updatedAt?: unknown;
  date?: string | unknown;
  deliveryZone?: string;
  deliveryAddress?: string;
  [key: string]: unknown;
}

export interface ReviewData {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  customerName: string;
  customerId?: string;
  createdAt?: unknown;
}

export interface OchapZone {
  id: string;
  name: string;
  active: boolean;
  basePrice?: number;
  status?: string;
  deliveryPrice?: number;
  [key: string]: unknown;
}

export interface OchapNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  recipientId: string;
  read: boolean;
  createdAt: unknown;
  productId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private products = signal<OchapProduct[]>([]);
  private orders = signal<OchapOrder[]>([]);
  private users = signal<OchapUser[]>([]);
  private zones = signal<OchapZone[]>([]);
  private notifications = signal<OchapNotification[]>([]);
  
  public products$ = this.products.asReadonly();
  public orders$ = this.orders.asReadonly();
  public users$ = this.users.asReadonly();
  public zones$ = this.zones.asReadonly();
  public notifications$ = this.notifications.asReadonly();

  // Unified derived signals for roles
  public suppliers$ = signal<OchapUser[]>([]);
  public clients$ = signal<OchapUser[]>([]);

  constructor() {
    this.testConnection();
  }

  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'system', 'connection_test'));
      console.log('O\'CHAP Engine: Firestore synchronized.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('offline')) {
        console.warn('O\'CHAP: Client seems offline. Sync will resume when connected.');
      }
    }
  }

  handleFirestoreError(error: unknown, operation: OperationType, path: string | null) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errInfo = {
      error: errorMessage,
      operationType: operation,
      path: path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // --- ADMIN WATCHERS ---
  private isBrowser = typeof window !== 'undefined';
  private noop = () => { /* no-op for SSR */ };

  watchAllOrders() {
    if (!this.isBrowser) return this.noop;
    const path = 'orders';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      this.orders.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapOrder)));
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  watchAllProducts() {
    if (!this.isBrowser) return this.noop;
    const path = 'products';
    return onSnapshot(collection(db, path), (snapshot) => {
      this.products.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapProduct)));
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  // watchAllSuppliers is now deprecated in favor of watchAllUsers
  // as users, suppliers and clients are unified in the 'users' collection.

  watchAllUsers() {
    if (!this.isBrowser) return this.noop;
    const path = 'users';
    return onSnapshot(collection(db, path), (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapUser));
      this.users.set(allUsers);
      
      // Update derived role signals with case-insensitive filtering
      const normalizeRole = (role: string) => role?.toLowerCase() || '';
      this.suppliers$.set(allUsers.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'supplier' || r === 'fournisseur';
      }));
      this.clients$.set(allUsers.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'client' || r === 'customer';
      }));
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  watchAllZones() {
    if (!this.isBrowser) return this.noop;
    const path = 'zones';
    return onSnapshot(collection(db, path), (snapshot) => {
      this.zones.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapZone)));
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  // --- SUPPLIER WATCHERS ---

  async getSupplierIdForUser(uid: string): Promise<string> {
    const q = query(collection(db, 'suppliers'), where('ownerUid', '==', uid));
    const snap = await getDocs(q);
    if (snap.empty) return uid; // Default to UID if no separate supplier doc
    return snap.docs[0].id;
  }

  watchSupplierOrders(supplierId: string) {
    if (!this.isBrowser) return this.noop;
    const path = 'orders';
    const q = query(collection(db, path), where('supplierId', '==', supplierId));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapOrder));
      // Sort in memory to avoid missing index error in sandbox
      docs.sort((a, b) => {
        const dateA = (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
        const dateB = (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
        return (dateB as number) - (dateA as number);
      });
      this.orders.set(docs);
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  watchSupplierProducts(supplierId: string) {
    if (!this.isBrowser) return this.noop;
    const path = 'products';
    const q = query(collection(db, path), where('supplierId', '==', supplierId));
    return onSnapshot(q, (snapshot) => {
      this.products.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapProduct)));
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  // --- CLIENT WATCHERS ---

  watchUserOrders(userId: string) {
    if (!this.isBrowser) return this.noop;
    const path = 'orders';
    const q = query(collection(db, path), where('customerUid', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapOrder));
      // Sort in memory
      docs.sort((a, b) => {
        const dateA = (a.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
        const dateB = (b.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
        return (dateB as number) - (dateA as number);
      });
      this.orders.set(docs);
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  async placeOrder(orderData: {
    customerName: string,
    customerUid: string,
    deliveryAddress: string,
    deliveryZone: string,
    items: OchapOrderItem[],
    totalAmount: number
  }) {
    const path = 'orders';
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Create order doc
        const orderRef = doc(collection(db, 'orders'));
        
        // 2. Process each item: check stock and decrement
        for (const item of orderData.items) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Produit ${item.name} introuvable.`);
          }
          
          const productData = productDoc.data() as OchapProduct;
          const currentStock = productData.stock || 0;
          
          if (currentStock < item.quantity) {
            throw new Error(`Stock insuffisant pour ${item.name}. Disponible: ${currentStock}`);
          }
          
          // Decrement stock
          transaction.update(productRef, {
            stock: currentStock - item.quantity,
            updatedAt: serverTimestamp()
          });
        }
        
        // 3. Set order data
        transaction.set(orderRef, {
          ...orderData,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // 4. Send notifications to Suppliers
      const supplierIds = new Set<string>();
      for (const item of orderData.items) {
        try {
          const p = await getDoc(doc(db, 'products', item.id));
          const sId = p.data()?.['supplierId'];
          if (sId) supplierIds.add(sId);
        } catch (e) {
          console.error('Error fetching supplierId:', e);
        }
      }

      for (const sId of supplierIds) {
        await this.addNotification(
          sId, 
          'Nouvelle Commande !', 
          `Vous avez reçu une nouvelle commande de ${orderData.items.length} article(s).`, 
          'order'
        );
      }

      return true;
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  }

  // Notifications and Smart Counters
  public pendingOrdersCount = computed(() => {
    return (this.orders$() as OchapOrder[]).filter(o => o.status === 'pending').length;
  });

  public lowStockCount = computed(() => {
    const products = this.products$() as OchapProduct[];
    return products.filter(p => (p.stock || 0) <= (p.threshold || 5)).length;
  });

  async addNotification(recipientId: string, title: string, message: string, type: 'order' | 'stock' | 'system' = 'system') {
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  }

  watchNotifications(recipientId: string) {
    if (!recipientId) return this.noop;
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OchapNotification));
      this.notifications.set(notes);
    }, (error) => {
      this.handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
  }

  async markNotificationRead(id: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error('Error marking read:', e);
    }
  }

  monitorStockLevels() {
    // This could also be a cloud function, but here we run it client-side for immediate feedback
    const products = this.products$() as OchapProduct[];
    products.forEach(p => {
      if (p.stock <= (p.threshold || 5)) {
        // Implementation logic for "Low Stock" alerts
      }
    });
  }

  async addProduct(product: Partial<OchapProduct>) {
    const path = 'products';
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    try {
      const docRef = doc(collection(db, 'products'));
      await runTransaction(db, async (transaction) => {
        transaction.set(docRef, {
          ...product,
          supplierId: userId, // Current authenticated user is the supplier
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          stock: product.stock || 0,
          rating: 0,
          reviewCount: 0
        });
      });
      return docRef.id;
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.CREATE, path);
    }
    return null;
  }

  async updateProduct(id: string, updates: Partial<OchapProduct>) {
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, 'products', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  }

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      return true;
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  }

  async updateStock(productId: string, newStock: number) {
    const path = `products/${productId}`;
    try {
      const pRef = doc(db, 'products', productId);
      await updateDoc(pRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      // Quick check for notification
      const pDoc = await getDoc(pRef);
      const pData = pDoc.data() as OchapProduct;
      if (newStock <= (pData.threshold || 5) && newStock > 0 && pData.supplierId) {
        await this.addNotification(
          pData.supplierId,
          'Alerte Stock Faible',
          `Le produit ${pData.name} est presque épuisé (Stock: ${newStock})`,
          'stock'
        );
      } else if (newStock === 0 && pData.supplierId) {
        await this.addNotification(
          pData.supplierId,
          'Rupture de Stock !',
          `Le produit ${pData.name} est épuisé.`,
          'stock'
        );
      }
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: status,
        updatedAt: serverTimestamp()
      });
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async submitReview(reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
    customerName: string;
  }) {
    const path = 'reviews';
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    try {
      await runTransaction(db, async (transaction: Transaction) => {
        // 1. Create review
        const reviewRef = doc(collection(db, 'reviews'));
        transaction.set(reviewRef, {
          ...reviewData,
          customerId: userId,
          createdAt: serverTimestamp()
        });

        // 2. Update product aggregation
        const productRef = doc(db, 'products', reviewData.productId);
        const productDoc = await transaction.get(productRef);
        if (productDoc.exists()) {
          const data = productDoc.data() as Record<string, unknown>;
          const currentCount = (data['reviewCount'] as number) || 0;
          const currentRating = (data['rating'] as number) || 0;
          
          const newCount = currentCount + 1;
          const newRating = ((currentRating * currentCount) + reviewData.rating) / newCount;
          
          transaction.update(productRef, {
            reviewCount: newCount,
            rating: newRating
          });
        }
      });
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  getReviews(productId: string, callback: (reviews: Record<string, unknown>[]) => void) {
    if (!this.isBrowser) return this.noop;
    const path = 'reviews';
    const q = query(
      collection(db, path), 
      where('productId', '==', productId)
    );
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
      // Sort in memory
      docs.sort((a, b) => {
        const dateA = (a['createdAt'] as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
        const dateB = (b['createdAt'] as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
        return (dateB as number) - (dateA as number);
      });
      callback(docs);
    }, (error: unknown) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  async deleteUserByEmail(email: string) {
    const isAdmin = auth.currentUser?.email === 'acherie812@gmail.com';
    if (!isAdmin) throw new Error('Action non autorisée. Seul un administrateur O\'CHAP peut effectuer cette opération.');

    const path = 'users';
    try {
      const q = query(collection(db, path), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        console.warn(`Aucun utilisateur trouvé avec l'email: ${email}`);
        return;
      }

      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
      console.log(`Utilisateur(s) supprimé(s) avec succès : ${email}`);
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async clearAllData() {
    const isAdmin = auth.currentUser?.email === 'acherie812@gmail.com';
    if (!isAdmin) throw new Error('Seul l\'administrateur principal peut réinitialiser la base de données.');

    const collectionsToClear = [
      'orders',
      'products',
      'notifications',
      'reviews',
      'zones',
      'catalog',
      'inventory'
    ];

    try {
      for (const collName of collectionsToClear) {
        const snap = await getDocs(collection(db, collName));
        const promises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(promises);
      }

      const userSnap = await getDocs(collection(db, 'users'));
      const userPromises = userSnap.docs
        .filter(d => d.data()['email']?.toLowerCase() !== 'acherie812@gmail.com')
        .map(d => deleteDoc(d.ref));
      await Promise.all(userPromises);
      
      return true;
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.DELETE, 'multiple-collections');
      return false;
    }
  }
}
