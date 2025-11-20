import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dao from '@/src/db/dao';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

let syncInstance: SupabaseSync | null = null;

export class SupabaseSync {
  private supabase: SupabaseClient;
  private userId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private getToken: () => Promise<string | null>;

  constructor(userId: string, getToken: () => Promise<string | null>) {
    this.userId = userId;
    this.getToken = getToken;
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('SupabaseSync initialized for user:', userId);
  }

  // ---------- SYNC: Journals ----------
  async syncJournals(): Promise<void> {
    try {
      console.log('Syncing journals...');
      
      // Obtener token de Clerk
      const token = await this.getToken();
      
      if (!token) {
        console.log('No token obtenido, saltando sync');
        return;
      }

      // Crear cliente con auth
      const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      
      // Obtener journals locales del usuario
      const localJournals = await dao.listJournals();
      console.log(`Journals locales: ${localJournals.length}`);
      
      // Obtener journals de Supabase 
      const { data: remoteJournals, error } = await supabaseWithAuth
        .from('journals')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error fetching remote journals:', error);
        throw error;
      }

      console.log(`Journals remotos: ${remoteJournals?.length || 0}`);

      // Crear mapa de journals remotos 
      const remoteMap = new Map(
        remoteJournals?.map(j => [j.id, j]) || []
      );

      // Subir journals locales
      for (const local of localJournals) {
        const remote = remoteMap.get(local.id);
        
        if (!remote || local.updated_at > remote.updated_at) {
          console.log(`⬆ Subiendo journal: ${local.name}`);
          const { error: upsertError } = await supabaseWithAuth
            .from('journals')
            .upsert({
              id: local.id,
              name: local.name,
              color: local.color,
              is_favorite: local.is_favorite,
              created_at: local.created_at,
              updated_at: local.updated_at,
              user_id: this.userId,
              default_pattern: (local as any).default_pattern || null,
              default_color: (local as any).default_color || null,
            });
          
          if (upsertError) {
            console.error('Error upserting journal:', upsertError);
          } else {
            console.log('Journal synced to remote:', local.id);
          }
        }
      }

      // Descargar journals remotos 
      const localIds = new Set(localJournals.map(j => j.id));
      
      for (const remote of remoteJournals || []) {
        if (!localIds.has(remote.id)) {
          const journalToInsert = {
            id: remote.id,
            name: remote.name,
            color: remote.color,
            is_favorite: remote.is_favorite ?? 0,
            created_at: remote.created_at,
            updated_at: remote.updated_at,
            user_id: remote.user_id,
          };
          
          await dao.insertJournalFromRemote(journalToInsert);
          console.log('⬇ Journal downloaded from remote:', remote.id);
        }
      }

      console.log('Journals synced successfully');
    } catch (error) {
      console.error('Error syncing journals:', error);
      throw error; 
    }
  }

  // ---------- SYNC: Pages ---------- 
  async syncPages(): Promise<void> {
    try {
      console.log('Syncing pages...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping pages sync');
        return;
      }
      
      console.log('Pages sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing pages:', error);
    }
  }

  // ---------- SYNC: Page Texts ---------- 
  async syncPageTexts(): Promise<void> {
    try {
      console.log('Syncing page texts...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping page texts sync');
        return;
      }

      // TODO: Implementar sync de page_texts
      console.log('Page texts sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing page texts:', error);
    }
  }

  // ---------- SYNC: Page Draws ---------- 
  async syncPageDraws(): Promise<void> {
    try {
      console.log('Syncing page draws...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping page draws sync');
        return;
      }

      // TODO: Implementar sync de page_draws
      console.log('Page draws sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing page draws:', error);
    }
  }

  // ---------- SYNC: Page Shapes ---------- 
  async syncPageShapes(): Promise<void> {
    try {
      console.log('Syncing page shapes...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping page shapes sync');
        return;
      }

      // TODO: Implementar sync de page_shapes
      console.log('Page shapes sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing page shapes:', error);
    }
  }

  // ---------- SYNC: Page Stickers ---------- 
  async syncPageStickers(): Promise<void> {
    try {
      console.log('Syncing page stickers...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping page stickers sync');
        return;
      }

      // TODO: Implementar sync de page_stickers
      console.log('Page stickers sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing page stickers:', error);
    }
  }

  // ---------- SYNC: Page Images ---------- 
  async syncPageImages(): Promise<void> {
    try {
      console.log('Syncing page images...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping page images sync');
        return;
      }

      // TODO: Implementar sync de page_images
      console.log('Page images sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing page images:', error);
    }
  }

  // ---------- SYNC: Page Audios ---------- 
  async syncPageAudios(): Promise<void> {
    try {
      console.log('Syncing page audios...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping page audios sync');
        return;
      }

      // TODO: Implementar sync de page_audios
      console.log('Page audios sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing page audios:', error);
    }
  }

  // ---------- SYNC: Tasks ---------- 
  async syncTasks(): Promise<void> {
    try {
      console.log('Syncing tasks...');
      
      const token = await this.getToken();
      if (!token) {
        console.log('No token, skipping tasks sync');
        return;
      }

      // TODO: Implementar sync de tasks
      console.log('Tasks sync (placeholder - implementar)');
    } catch (error) {
      console.error('Error syncing tasks:', error);
    }
  }

  // ---------- SYNC COMPLETO ---------- 
  async performFullSync(): Promise<void> {
    console.log('Starting full sync...');
    
    try {
      await this.syncJournals();
      await this.syncPages();
      await this.syncPageTexts();
      await this.syncPageDraws();
      await this.syncPageShapes();
      await this.syncPageStickers();
      await this.syncPageImages();
      await this.syncPageAudios();
      await this.syncTasks();
      
      console.log('Full sync completed successfully');
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }

  // ---------- SYNC AUTOMATICO ---------- 
  startAutoSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`Starting auto-sync every ${intervalMs / 1000} seconds`);
    
    this.syncInterval = setInterval(() => {
      this.performFullSync().catch(error => {
        console.error('Auto-sync error:', error);
      });
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸Auto-sync stopped');
    }
  }

  // ---------- CLEANUP ---------- 
  destroy(): void {
    console.log('SupabaseSync destroyed');
    
    // Detener auto-sync
    this.stopAutoSync();
    
    // Cerrar canales de Supabase
    if (this.supabase) {
      try {
        this.supabase.removeAllChannels();
        console.log('Canales de Supabase removidos');
      } catch (error) {
        console.error('Error removiendo canales:', error);
      }
    }
  }
}

// ---------- INICIALIZACION ---------- 
export function initSync(userId: string, getToken: () => Promise<string | null>): SupabaseSync {
  if (syncInstance) {
    console.log('Destruyendo instancia anterior de sync...');
    syncInstance.destroy();
  }

  syncInstance = new SupabaseSync(userId, getToken);
  return syncInstance;
}

export function getSyncInstance(): SupabaseSync | null {
  return syncInstance;
}

export function destroySync(): void {
  if (syncInstance) {
    syncInstance.destroy();
    syncInstance = null;
    console.log('Sync instance destroyed and cleared');
  }
}