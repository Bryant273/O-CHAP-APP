import { Injectable, signal, computed, inject } from '@angular/core';
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
import * as XLSX from 'xlsx';
import { AuthService } from './auth.service';

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
  supplierRef?: string;
  galleryUrls?: string[];
  threshold?: number;
  rating?: number;
  reviewCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  supplierName?: string;
  aiAnalysis?: string;
  technicalSpecs?: string;
  profitMargin?: number;
  seasonalTrend?: string;
  [key: string]: unknown;
}

export interface OchapOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerUid?: string;
  supplierId?: string;
  items: OchapOrderItem[];
  total: number;
  totalAmount?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'transit' | 'delivered' | 'completed' | 'cancelled' | 'return_requested' | 'returned';
  trackingHistory?: { status: string; timestamp: unknown; note?: string }[];
  invoiceUrl?: string;
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
  private categories = signal<{id: string, name: string}[]>([]);
  
  public products$ = this.products.asReadonly();
  public orders$ = this.orders.asReadonly();
  public users$ = this.users.asReadonly();
  public zones$ = this.zones.asReadonly();
  public notifications$ = this.notifications.asReadonly();
  public categories$ = this.categories.asReadonly();

  public formatAmount(val: number | string | unknown): string {
    const n = Math.round(Number(val) || 0);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  // Unified derived signals for roles
  public suppliers$ = signal<OchapUser[]>([]);
  public clients$ = signal<OchapUser[]>([]);

  private authService = inject(AuthService);

  public currentUser$ = computed(() => this.authService.profile$());

  constructor() {
    this.watchAllCategories();
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
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType: operation,
      path: path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    
    // Only throw a hard exception for mutations (creating, updating, deleting)
    // so that form submission handlers can catch and report them.
    // For reads/lists/watchers, do not throw globally as it can crash the Angular bootstrap process.
    if (operation === OperationType.CREATE || 
        operation === OperationType.UPDATE || 
        operation === OperationType.DELETE || 
        operation === OperationType.WRITE) {
      throw new Error(JSON.stringify(errInfo));
    }
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

  watchAllCategories() {
    if (!this.isBrowser) return this.noop;
    const path = 'categories';
    return onSnapshot(collection(db, path), (snapshot) => {
      this.categories.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as {id: string, name: string})));
    }, (error) => this.handleFirestoreError(error, OperationType.LIST, path));
  }

  async addCategory(name: string) {
    const path = 'categories';
    try {
      await addDoc(collection(db, path), { name, createdAt: serverTimestamp() });
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.DELETE, path);
    }
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
    totalAmount: number,
    paymentMethod?: string,
    deliveryFee?: number,
    phoneNumber?: string
  }) {
    const path = 'orders';
    try {
      const createdOrderIds: string[] = [];
      await runTransaction(db, async (transaction) => {
        // Collect product data to group by supplier
        const itemWithSupplierDetails: (OchapOrderItem & { supplierId: string, supplierName: string })[] = [];

        // 1. Process each item: check stock, decrement, and fetch supplier data
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

          // Extract supplier
          const supplierId = productData.supplierId || 'admin_seller';
          const supplierName = productData.supplierName || productData.brand || 'vendeur_agree';

          itemWithSupplierDetails.push({
            ...item,
            supplierId,
            supplierName
          });
        }

        // 2. Group items by supplierId
        const groups: Record<string, typeof itemWithSupplierDetails> = {};
        for (const item of itemWithSupplierDetails) {
          if (!groups[item.supplierId]) {
            groups[item.supplierId] = [];
          }
          groups[item.supplierId].push(item);
        }

        // 3. Create an order for each supplier group
        const totalGroups = Object.keys(groups).length;
        for (const [supplierId, groupItems] of Object.entries(groups)) {
          const orderRef = doc(collection(db, 'orders'));
          createdOrderIds.push(orderRef.id);

          const groupSubtotal = groupItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          
          // Allocate delivery fee (only on first group or fully if separate deliveries)
          const groupDeliveryFee = (orderData.deliveryFee || 0) / totalGroups;
          const groupTotal = groupSubtotal + groupDeliveryFee;

          // Structure the order
          transaction.set(orderRef, {
            customerName: orderData.customerName,
            customerUid: orderData.customerUid,
            deliveryAddress: orderData.deliveryAddress,
            deliveryZone: orderData.deliveryZone,
            phoneNumber: orderData.phoneNumber || '',
            paymentMethod: orderData.paymentMethod || 'Espèces',
            deliveryFee: groupDeliveryFee,
            items: groupItems.map(gi => ({
              id: gi.id,
              name: gi.name,
              price: gi.price,
              quantity: gi.quantity,
              imageUrl: gi.imageUrl,
              category: gi.category,
              supplierId: gi.supplierId,
              supplierName: gi.supplierName,
              orderId: orderRef.id // Attach the specific order ID to each product item
            })),
            total: groupSubtotal, // original items subtotal
            totalAmount: groupTotal, // subtotal + delivery fee
            supplierId: supplierId,
            supplierName: groupItems[0].supplierName,
            id: orderRef.id,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      });

      // 4. Send notifications to Suppliers & check for stock alert triggers
      for (const orderId of createdOrderIds) {
        try {
          const orderSnap = await getDoc(doc(db, 'orders', orderId));
          if (orderSnap.exists()) {
            const oData = orderSnap.data();
            const sId = oData['supplierId'];
            if (sId) {
              await this.addNotification(
                sId, 
                'Nouvelle Commande !', 
                `Vous avez reçu une nouvelle commande #${orderId.slice(-8).toUpperCase()} de ${oData['items']?.length || 0} article(s).`, 
                'order'
              );
            }

            // Check stock level for every item in this order
            const items = oData['items'] || [];
            for (const item of items) {
              const productId = item.id;
              if (productId) {
                const pRef = doc(db, 'products', productId);
                const pDoc = await getDoc(pRef);
                if (pDoc.exists()) {
                  const pData = pDoc.data() as OchapProduct;
                  const currentStock = pData.stock || 0;
                  const currentThreshold = pData.threshold || 5;
                  if (currentStock <= currentThreshold) {
                    await this.checkAndTriggerStockNotification(productId, currentStock, currentThreshold);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error fetching order for notification:', e);
        }
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

  async addNotification(recipientId: string, title: string, message: string, type = 'system', productId?: string) {
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
        productId: productId || null
      });
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  }

  // Real-time stock level monitoring alerts and email simulation
  async checkAndTriggerStockNotification(productId: string, newStock: number, threshold = 5) {
    try {
      const pRef = doc(db, 'products', productId);
      const pDoc = await getDoc(pRef);
      if (!pDoc.exists()) return;
      const pData = pDoc.data() as OchapProduct;
      const supplierId = pData.supplierId;
      if (!supplierId) return;

      const title = newStock === 0 ? 'Rupture de Stock !' : 'Alerte Stock Faible';
      const message = newStock === 0 
        ? `Le produit ${pData.name} est épuisé (0 en stock). Veuillez réapprovisionner pour Abidjan.`
        : `Le produit ${pData.name} est sous le seuil critique (Stock restant: ${newStock}, Seuil: ${threshold}).`;

      // Deduplicate unread stock alerts for the same product to prevent spam
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', supplierId),
        where('productId', '==', productId),
        where('type', '==', 'stock'),
        where('read', '==', false),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        await this.addNotification(supplierId, title, message, 'stock', productId);
        
        // Simulate immediate email notification
        console.log(`[Email Sentinel O'CHAP] Alerte de stock envoyée à l'adresse e-mail associée au fournisseur ${supplierId}. Sujet: ${title}. Message: ${message}`);
      }
    } catch (err) {
      console.error('Error in checkAndTriggerStockNotification:', err);
    }
  }

  watchNotifications(recipientId: string) {
    if (!this.isBrowser) return this.noop;
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
    const products = this.products$() as OchapProduct[];
    products.forEach(p => {
      if (p.stock <= (p.threshold || 5)) {
        this.checkAndTriggerStockNotification(p.id, p.stock, p.threshold || 5);
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
          id: docRef.id,
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

      // Post-update: check if stock or threshold was modified and could trigger an alert
      if (updates.stock !== undefined) {
        const threshold = updates.threshold !== undefined ? updates.threshold : 5;
        await this.checkAndTriggerStockNotification(id, Number(updates.stock), Number(threshold));
      }
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

  async clearAllProducts() {
    const path = 'products';
    try {
      const snap = await getDocs(collection(db, path));
      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
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

      // Fetch and check for stock alerts using our centralized alert system
      const pDoc = await getDoc(pRef);
      const pData = pDoc.data() as OchapProduct;
      const threshold = pData.threshold || 5;
      if (newStock <= threshold) {
        await this.checkAndTriggerStockNotification(productId, newStock, threshold);
      }
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    const path = `orders/${orderId}`;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: status,
        updatedAt: serverTimestamp()
      });

      // Get customer Uid and send status notification
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const customerUid = orderData['customerUid'];
        if (customerUid) {
          const statusLabels: Record<string, string> = {
            'pending': 'Vérification en cours',
            'confirmed': 'Préparation Logistique',
            'shipped': 'En cours d\'expédition Abidjan',
            'delivered': 'Livrée à destination / Reçue',
            'completed': 'Terminée',
            'cancelled': 'Annulée'
          };
          const label = statusLabels[status] || status;
          await this.addNotification(
            customerUid,
            'Mise à jour d\'expédition O\'CHAP !',
            `Le statut de votre commande #${orderId.slice(-8).toUpperCase()} est à présent : ${label}.`,
            'system'
          );
        }
      }
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

  async markOrderAsReviewed(orderId: string) {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        reviewed: true,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
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

  async updateUserRole(userId: string, newRole: string) {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (error: unknown) {
      this.handleFirestoreError(error, OperationType.UPDATE, path);
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

  // --- AI FEATURES (GEMINI) ---

  async generateDescription(productName: string, category: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, category })
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      return data.text || "";
    } catch (error) {
      console.error('Describe API Error:', error);
      return "Erreur lors de la génération de la description.";
    }
  }

  async analyzeInventoryPerformance(): Promise<string> {
    const products = this.products$();
    const orders = this.orders$();
    
    // Create a summary for the prompt
    const productSummary = products.map(p => ({
      name: p.name,
      stock: p.stock as number,
      threshold: (p.threshold as number) || 5,
      price: p.price
    }));

    const orderSummary = orders.slice(0, 50).map(o => ({
      date: o.date,
      total: o.total,
      status: o.status
    }));

    try {
      const res = await fetch('/api/ai/analyze-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSummary, orderSummary })
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      return data.text || "";
    } catch (error) {
      console.error('Inventory API Error:', error);
      return "Impossible d'effectuer l'analyse intelligente pour le moment.";
    }
  }

  // --- EXPORT TOOLS ---

  exportProductsToExcel() {
    const products = this.products$();
    const worksheet = XLSX.utils.json_to_sheet(products.map(p => ({
      ID: p.id,
      Nom: p.name,
      Catégorie: p.category,
      Marque: p.brand || 'N/A',
      Prix: p.price,
      Stock: p.stock,
      Fournisseur: p.supplierName || p.supplierId
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogue');
    XLSX.writeFile(workbook, `Catalogue_OCHAP_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // --- NEW BUSINESS FEATURES ---

  async runMarketingAutomation() {
    try {
      const productsInShortage = this.products().filter(p => ((p.stock as number) || 0) < ((p.threshold as number) || 5));
      const latestPromos = this.products().filter(p => p['isPromo']);

      const res = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortageCount: productsInShortage.length,
          promoCount: latestPromos.length
        })
      });
      if (!res.ok) throw new Error('API request failed');
      return await res.json();
    } catch (e) {
      console.error('Marketing API Error:', e);
      return [];
    }
  }

  async getAdvancedAnalytics() {
    try {
      const products = this.products();
      const orders = this.orders().slice(0, 50);
      const optimizedProducts = products.slice(0, 10).map(p => ({
        n: p.name,
        c: p.category,
        b: p.brand,
        p: p.price,
        m: p.profitMargin
      }));

      const res = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: optimizedProducts,
          ordersCount: orders.length
        })
      });
      if (!res.ok) throw new Error('API request failed');
      return await res.json();
    } catch (e) {
      console.error('Analytics API Error:', e);
      return { globalHealth: 'stable', profitAnalysis: 'Analyse indisponible.', topPerformingBrands: [], seasonalInsights: '', stockAlerts: [] };
    }
  }

  async createSavRequest(data: Record<string, unknown>) {
    try {
      await addDoc(collection(db, 'sav_requests'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error('SAV Error:', e);
      return false;
    }
  }

  async generateInvoice(orderId: string): Promise<string> {
    const order = this.orders$().find(o => o.id === orderId);
    if (!order) throw new Error('Commande introuvable');

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Set professional font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(13, 27, 42); // Navy
    doc.text('O\'CHAP AFRIQUE', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Abidjan, Côte d\'Ivoire', 20, 30);
    doc.text('Email: info@ochap.afrique', 20, 35);

    // Business info decoration
    doc.setDrawColor(255, 96, 0); // Primary orange
    doc.setLineWidth(1.5);
    doc.line(20, 45, 190, 45);

    // Order Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 27, 42);
    doc.text(`FACTURE N° ${orderId.slice(-8).toUpperCase()}`, 20, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date : ${new Date(((order.createdAt as { seconds: number })?.seconds || 0) * 1000).toLocaleDateString('fr-FR')}`, 20, 70);
    doc.text(`Statut : ${order.status?.toUpperCase()}`, 20, 75);
    doc.text(`Client : ${(this.currentUser$() as OchapUser)?.displayName || 'Client O\'CHAP'}`, 20, 80);

    // Table Header
    doc.setFillColor(240, 242, 245);
    doc.rect(20, 95, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Produit', 25, 102);
    doc.text('Qté', 140, 102);
    doc.text('Total (CFA)', 165, 102);

    // Table Body
    let y = 115;
    order.items.forEach((item: OchapOrderItem) => {
      doc.setFont('helvetica', 'normal');
      doc.text(item.name, 25, y);
      doc.text(item.quantity.toString(), 142, y);
      doc.text(this.formatAmount(item.price * item.quantity), 165, y);
      y += 10;
    });

    // Total
    doc.line(20, y + 5, 190, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL PAYÉ', 120, y + 15);
    doc.setTextColor(255, 96, 0);
    doc.text(`${this.formatAmount(order.totalAmount || order.total)} CFA`, 165, y + 15);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Merci de votre confiance. Facture générée numériquement par O\'CHAP ENGINE.', 20, 280);

    // Return blob URL
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }
}
