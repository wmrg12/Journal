import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dao from '@/src/db/dao';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

let syncInstance: SupabaseSync | null = null;

export class SupabaseSync {
  private supabase: SupabaseClient;
  private userId: string;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
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
      
      const token = await this.getToken();
      
      if (!token) {
        console.log('No token obtenido, saltando sync');
        return;
      }

      const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      
      const localJournals = await dao.listAllJournalsForSync();
      console.log(`Journals locales (incluyendo eliminados): ${localJournals.length}`);
      
      const { data: remoteJournals, error } = await supabaseWithAuth
        .from('journals')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error fetching remote journals:', error);
        throw error;
      }

      console.log(`Journals remotos: ${remoteJournals?.length || 0}`);

      const remoteMap = new Map(
        remoteJournals?.map(j => [j.id, j]) || []
      );

      // Subir journals locales 
      for (const local of localJournals) {
        const remote = remoteMap.get(local.id);
        
        if (!remote || local.updated_at > remote.updated_at) {
          console.log(`Subiendo journal: ${local.name} ${local.deleted_at ? '(eliminado)' : ''}`);
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
              deleted_at: local.deleted_at || null,
            });
          
          if (upsertError) {
            console.error('Error upserting journal:', upsertError);
          } else {
            console.log('Journal synced to remote:', local.id);
          }
        }
      }

      // Lógica de descarga
      const localMap = new Map(localJournals.map(j => [j.id, j]));
      
      for (const remote of remoteJournals || []) {
        const local = localMap.get(remote.id);
        
        // Si está eliminado en remoto, eliminarlo localmente
        if (remote.deleted_at) {
  if (local && !local.deleted_at) { 
    console.log(` Eliminando journal local (borrado en remoto)`);
    await dao.hardDeleteJournal(remote.id);
  }
  continue;
}
        
        // Si no existe localmente, descargarlo
        if (!local) {
          console.log(`Descargando journal: ${remote.name}`);
          await dao.insertJournalFromRemote({
            id: remote.id,
            name: remote.name,
            color: remote.color,
            is_favorite: remote.is_favorite ?? 0,
            created_at: remote.created_at,
            updated_at: remote.updated_at,
            user_id: remote.user_id,
          });
        } 
        // Si existe localmente y el remoto es más nuevo, actualizar
        else if (remote.updated_at > local.updated_at) {
          console.log(` Actualizando journal: ${remote.name}`);
          await dao.insertJournalFromRemote({
            id: remote.id,
            name: remote.name,
            color: remote.color,
            is_favorite: remote.is_favorite ?? 0,
            created_at: remote.created_at,
            updated_at: remote.updated_at,
            user_id: remote.user_id,
          });
        }
      }

      console.log(' Journals synced successfully');
    } catch (error) {
      console.error(' Error syncing journals:', error);
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

    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const localPages = await dao.listAllPagesForSync();
    console.log(`Páginas locales (incluyendo eliminadas): ${localPages.length}`);

    const { data: remotePages, error } = await supabaseWithAuth
      .from('pages')
      .select('*')
      .eq('user_id', this.userId)
      .is('deleted_at', null); 

    if (error) {
      console.error('Error fetching remote pages:', error);
      throw error;
    }

    console.log(`Páginas remotas: ${remotePages?.length || 0}`);

    const remoteMap = new Map(
      remotePages?.map(p => [p.id, p]) || []
    );

    // SUBIR páginas locales al servidor
    for (const local of localPages) {
      const remote = remoteMap.get(local.id);
      
      const shouldSync = !remote || 
                        local.deleted_at !== null || 
                        local.updated_at > (remote?.updated_at || 0);
      
      if (shouldSync) {
        const status = local.deleted_at ? ' (eliminada)' : '';
        console.log(`${status} Subiendo página: ${local.page_number} del journal ${local.journal_id.substring(0, 8)}...`);
        
        const pageData: any = {
          id: local.id,
          journal_id: local.journal_id,
          page_number: local.page_number,
          bg_color: local.color,
          pattern: local.pattern || 'none',
          created_at: local.created_at,
          updated_at: local.updated_at,
          user_id: this.userId,
        };
        
        pageData.deleted_at = (local.deleted_at !== null && local.deleted_at !== undefined) 
          ? local.deleted_at 
          : null;
        
        const { error: upsertError } = await supabaseWithAuth
          .from('pages')
          .upsert(pageData);
        
        if (upsertError) {
          console.error('Error upserting page:', upsertError);
        } else {
          console.log(` Página sincronizada: ${local.id.substring(0, 8)}`);
        }
      }
    }

    // OBTENER LISTA DE JOURNALS LOCALES VÁLIDOS
    const localJournals = await dao.listJournals(); 
    const validJournalIds = new Set(localJournals.map(j => j.id));
    
    console.log(` Journals locales válidos: ${validJournalIds.size}`);

    // DESCARGAR páginas remotas
    const localMap = new Map(localPages.map(p => [p.id, p]));
    
    for (const remote of remotePages || []) {
      // SKIP si el journal no existe localmente
      if (!validJournalIds.has(remote.journal_id)) {
        console.log(` Saltando página ${remote.page_number} - journal ${remote.journal_id.substring(0, 8)} no existe localmente`);
        continue;
      }
      
      const local = localMap.get(remote.id);
      
      if (remote.deleted_at) {
        if (local && !local.deleted_at) {  
          console.log(` Eliminando página local (borrada en remoto)`);
          await dao.hardDeletePage(remote.id);
        }
        continue;
      }
      
      if (!local) {
        console.log(` Descargando página: ${remote.page_number} del journal ${remote.journal_id.substring(0, 8)}...`);
        await dao.insertPageFromRemote({
          id: remote.id,
          journal_id: remote.journal_id,
          page_number: remote.page_number,
          color: remote.bg_color,
          pattern: remote.pattern || 'none',
          created_at: remote.created_at,
          updated_at: remote.updated_at,
          user_id: remote.user_id,
          deleted_at: remote.deleted_at || null, 
        });
      } 
      else if (remote.updated_at > local.updated_at) {
        console.log(` Actualizando página: ${remote.page_number}`);
        await dao.insertPageFromRemote({
          id: remote.id,
          journal_id: remote.journal_id,
          page_number: remote.page_number,
          color: remote.bg_color,
          pattern: remote.pattern || 'none',
          created_at: remote.created_at,
          updated_at: remote.updated_at,
          user_id: remote.user_id,
          deleted_at: remote.deleted_at || null,
        });
      }
    }

    console.log('Pages synced successfully');
  } catch (error) {
    console.error(' Error syncing pages:', error);
    throw error;
  }
}

  // ---------- SYNC: Page Texts ---------- 
  
async syncPageTexts(): Promise<void> {
  try {
    console.log(' Syncing page texts...');
    
    const token = await this.getToken();
    if (!token) {
      console.log('No token, skipping page texts sync');
      return;
    }

    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const localTexts = await dao.listAllPageTextsForSync();
    console.log(`Textos locales (incluyendo eliminados): ${localTexts.length}`);

    const { data: remoteTexts, error } = await supabaseWithAuth
      .from('page_texts')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching remote texts:', error);
      throw error;
    }

    console.log(`Textos remotos: ${remoteTexts?.length || 0}`);

    const remoteMap = new Map(remoteTexts?.map(t => [t.id, t]) || []);

    for (const local of localTexts) {
  const remote = remoteMap.get(local.id);
  
  const shouldSync = !remote || 
                    local.deleted_at !== null || 
                    local.updated_at > remote.updated_at;
  
  if (shouldSync) {
    const status = local.deleted_at ? '(eliminado)' : '';
    console.log(`${status} Subiendo texto: ${local.id.substring(0, 8)}`);
    
    console.log('Debug - local object:', JSON.stringify(local));
    console.log('Debug - local.id:', local.id);
    console.log(' Debug - typeof local.id:', typeof local.id);
    
    const { error: upsertError } = await supabaseWithAuth.from('page_texts').upsert({
      id: local.id,
      page_id: local.page_id,
      content: local.content,
      font_family: local.font_family,
      color: local.color,
      position_x: local.position_x,
      position_y: local.position_y,
      font_size: local.font_size,
      rotation: local.rotation ?? 0,
      is_locked: local.is_locked ?? 0,
      created_at: local.created_at,
      updated_at: local.updated_at,
      user_id: this.userId,
      deleted_at: local.deleted_at || null,
    });
    
    if (upsertError) {
      console.error(' Error upserting text:', upsertError);
    } else {
      console.log(`Texto sincronizado: ${local.id.substring(0, 8)}`);
    }
  }
}
     // DESCARGAR textos remotos
    const localMap = new Map(localTexts.map(t => [t.id, t]));
    
    //g OBTENER IDS DE PÁGINAS VÁLIDAS
    const allLocalPages = await dao.listAllPagesForSync();
    const validPageIds = new Set(
      allLocalPages.filter(p => !p.deleted_at).map(p => p.id)
    );
    console.log(`Páginas locales válidas para textos: ${validPageIds.size}`);
    
    for (const remote of remoteTexts || []) {
      // SKIP si la página no existe localmente
      if (!validPageIds.has(remote.page_id)) {
        console.log(` Saltando texto - página ${remote.page_id.substring(0, 8)} no existe`);
        continue;
      }
      
      const local = localMap.get(remote.id);
      
      if (remote.deleted_at) {
        if (local && !local.deleted_at) {
          console.log(` Eliminando texto local (borrado en remoto)`);
          await dao.hardDeletePageText(remote.id);
        }
        continue;
      }
      
      if (!local || remote.updated_at > local.updated_at) {
        await dao.insertPageTextFromRemote(remote);
      }
    }

    console.log(' Page texts synced');
  } catch (error) {
    console.error(' Error syncing page texts:', error);
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

      const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const localDraws = await dao.listAllPageDrawsForSync();
      console.log(`Dibujos locales: ${localDraws.length}`);

      const { data: remoteDraws, error } = await supabaseWithAuth
        .from('page_draws')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error fetching remote draws:', error);
        throw error;
      }

      console.log(`Dibujos remotos: ${remoteDraws?.length || 0}`);

      const remoteMap = new Map(remoteDraws?.map(d => [d.id, d]) || []);

      // SUBIR dibujos locales
for (const local of localDraws) {
  const remote = remoteMap.get(local.id);
  
  const shouldSync = !remote || 
                    local.deleted_at !== null || 
                    local.updated_at > remote.updated_at;
  
  if (shouldSync) {
    const status = local.deleted_at ? '(eliminado)' : '';
    console.log(`${status} Subiendo dibujo: ${local.id.substring(0, 8)}`);
    
    await supabaseWithAuth.from('page_draws').upsert({
            id: local.id,
            page_id: local.page_id,
            path_d: local.path_d,
            color: local.color,
            width: local.width,
            opacity: local.opacity,
            tool: local.tool,
            order_index: local.order_index,
            created_at: local.created_at,
            updated_at: local.updated_at,
            user_id: this.userId,
            deleted_at: local.deleted_at || null,
          });
        }
      }
      // DESCARGAR dibujos remotos
      const localMap = new Map(localDraws.map(d => [d.id, d]));
      
      //  OBTENER IDS DE PÁGINAS VÁLIDAS
      const allLocalPages = await dao.listAllPagesForSync();
      const validPageIds = new Set(
        allLocalPages.filter(p => !p.deleted_at).map(p => p.id)
      );
      console.log(` Páginas locales válidas para dibujos: ${validPageIds.size}`);
      
      for (const remote of remoteDraws || []) {
        //  SKIP si la página no existe localmente
        if (!validPageIds.has(remote.page_id)) {
          console.log(`  Saltando dibujo - página ${remote.page_id.substring(0, 8)} no existe`);
          continue;
        }
        
        const local = localMap.get(remote.id);
        
        if (remote.deleted_at) {
          if (local && !local.deleted_at) {  
            console.log(` Eliminando dibujo local (borrado en remoto)`);
            await dao.hardDeletePageDraw?.(remote.id);
          }
          continue;
        }
        
        if (!local || remote.updated_at > local.updated_at) {
          await dao.insertPageDrawFromRemote(remote);
        }
      }

      console.log(' Page draws synced');
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

      const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const localShapes = await dao.listAllPageShapesForSync();
      console.log(`Formas locales: ${localShapes.length}`);

      const { data: remoteShapes, error } = await supabaseWithAuth
        .from('page_shapes')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error fetching remote shapes:', error);
        throw error;
      }

      console.log(`Formas remotas: ${remoteShapes?.length || 0}`);

      const remoteMap = new Map(remoteShapes?.map(s => [s.id, s]) || []);

      // SUBIR formas locales
for (const local of localShapes) {
  const remote = remoteMap.get(local.id);
  
  const shouldSync = !remote || 
                    local.deleted_at !== null || 
                    local.updated_at > remote.updated_at;
  
  if (shouldSync) {
    const status = local.deleted_at ? '(eliminado)' : '';
    console.log(`${status} Subiendo forma: ${local.id.substring(0, 8)}`);
    
    await supabaseWithAuth.from('page_shapes').upsert({
            id: local.id,
            page_id: local.page_id,
            shape_type: local.shape_type,
            color: local.color,
            position_x: local.position_x,
            position_y: local.position_y,
            width: local.width,
            height: local.height,
            rotation: local.rotation ?? 0,
            is_locked: local.is_locked ?? 0,
            created_at: local.created_at,
            updated_at: local.updated_at,
            user_id: this.userId,
            deleted_at: local.deleted_at || null,
          });
        }
      }

      // DESCARGAR formas remotas
      const localMap = new Map(localShapes.map(s => [s.id, s]));
      
      //  OBTENER IDS DE PÁGINAS VÁLIDAS
      const allLocalPages = await dao.listAllPagesForSync();
      const validPageIds = new Set(
        allLocalPages.filter(p => !p.deleted_at).map(p => p.id)
      );
      console.log(`Páginas locales válidas para formas: ${validPageIds.size}`);
      
      for (const remote of remoteShapes || []) {
        //  SKIP si la página no existe localmente
        if (!validPageIds.has(remote.page_id)) {
          console.log(`  Saltando forma - página ${remote.page_id.substring(0, 8)} no existe`);
          continue;
        }
        
        const local = localMap.get(remote.id);
        
        if (remote.deleted_at) {
          if (local && !local.deleted_at) {  
            console.log(` Eliminando forma local (borrada en remoto)`);
            await dao.hardDeletePageShape?.(remote.id);
          }
          continue; 
        }
        
        if (!local || remote.updated_at > local.updated_at) {
          await dao.insertPageShapeFromRemote(remote);
        }
      }

      console.log(' Page shapes synced');
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

      const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const localStickers = await dao.listAllPageStickersForSync();
      console.log(`Stickers locales: ${localStickers.length}`);

      const { data: remoteStickers, error } = await supabaseWithAuth
        .from('page_stickers')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error fetching remote stickers:', error);
        throw error;
      }

      console.log(`Stickers remotos: ${remoteStickers?.length || 0}`);

      const remoteMap = new Map(remoteStickers?.map(s => [s.id, s]) || []);

      // SUBIR stickers locales
for (const local of localStickers) {
  const remote = remoteMap.get(local.id);
  
  const shouldSync = !remote || 
                    local.deleted_at !== null || 
                    local.updated_at > remote.updated_at;
  
  if (shouldSync) {
    const status = local.deleted_at ? ' (eliminado)' : '';
    console.log(`${status} Subiendo sticker: ${local.id.substring(0, 8)}`);
    
    await supabaseWithAuth.from('page_stickers').upsert({
            id: local.id,
            page_id: local.page_id,
            sticker_url: local.sticker_url,
            sticker_category: local.sticker_category,
            position_x: local.position_x,
            position_y: local.position_y,
            width: local.width,
            height: local.height,
            rotation: local.rotation ?? 0,
            is_locked: local.is_locked ?? 0,
            created_at: local.created_at,
            updated_at: local.updated_at,
            user_id: this.userId,
            deleted_at: local.deleted_at || null,
          });
        }
      }

     // DESCARGAR stickers remotos
      const localMap = new Map(localStickers.map(s => [s.id, s]));
      
      //  OBTENER IDS DE PÁGINAS VÁLIDAS
      const allLocalPages = await dao.listAllPagesForSync();
      const validPageIds = new Set(
        allLocalPages.filter(p => !p.deleted_at).map(p => p.id)
      );
      console.log(` Páginas locales válidas para stickers: ${validPageIds.size}`);
      
      for (const remote of remoteStickers || []) {
        //  SKIP si la página no existe localmente
        if (!validPageIds.has(remote.page_id)) {
          console.log(` Saltando sticker - página ${remote.page_id.substring(0, 8)} no existe`);
          continue;
        }
        
        const local = localMap.get(remote.id);
        
        if (remote.deleted_at) {
          if (local && !local.deleted_at) {  
            console.log(` Eliminando sticker local (borrado en remoto)`);
            await dao.hardDeletePageSticker?.(remote.id);
          }
          continue;
        }

        if (!local || remote.updated_at > local.updated_at) {
          await dao.insertPageStickerFromRemote(remote);
        }
      }

      console.log(' Page stickers synced');
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

    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const localImages = await dao.listAllPageImagesForSync();
    console.log(`Imagenes locales: ${localImages.length}`);

    const { data: remoteImages, error } = await supabaseWithAuth
      .from('page_images')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching remote images:', error);
      throw error;
    }

    console.log(`Imagenes remotas: ${remoteImages?.length || 0}`);

    const remoteMap = new Map(remoteImages?.map(i => [i.id, i]) || []);

    // SUBIR imágenes locales
    for (const local of localImages) {
      const remote = remoteMap.get(local.id);
      
      const shouldSync = !remote || 
                        local.deleted_at !== null || 
                        local.updated_at > remote.updated_at;
      
      if (shouldSync) {
        const status = local.deleted_at ? '(eliminada)' : '';
        console.log(`${status} Subiendo imagen: ${local.id.substring(0, 8)}`);
        
        await supabaseWithAuth.from('page_images').upsert({
          id: local.id,
          page_id: local.page_id,
          uri: local.uri,
          position_x: local.position_x,
          position_y: local.position_y,
          width: local.width,
          height: local.height,
          rotation: local.rotation ?? 0,
          created_at: local.created_at,
          updated_at: local.updated_at,
          user_id: this.userId,
          deleted_at: local.deleted_at || null,
        });
      }
    }

    // DESCARGAR imágenes remotas
    const localMap = new Map(localImages.map(i => [i.id, i]));
    
    // OBTENER IDS DE PÁGINAS VÁLIDAS
    const allLocalPages = await dao.listAllPagesForSync();
    const validPageIds = new Set(
      allLocalPages.filter(p => !p.deleted_at).map(p => p.id)
    );
    console.log(`Paginas locales validas para imagenes: ${validPageIds.size}`);
    
    for (const remote of remoteImages || []) {
      // SKIP si la página no existe localmente
      if (!validPageIds.has(remote.page_id)) {
        console.log(`Saltando imagen - pagina ${remote.page_id.substring(0, 8)} no existe`);
        continue;
      }
      
      const local = localMap.get(remote.id);
      
      if (remote.deleted_at) {
        if (local && !local.deleted_at) { 
          console.log('Eliminando imagen local (borrada en remoto)');
          await dao.hardDeletePageImage?.(remote.id);
        }
        continue;
      }
      
      // Descargar si no existe o si existe pero necesita actualización
      if (!local || remote.updated_at > local.updated_at) {
        console.log(`Procesando imagen desde Supabase: ${remote.id.substring(0, 8)}`);
        
        let localUri = remote.uri;
        
        // SIEMPRE descargar si es URL de Supabase
        if (remote.uri && (remote.uri.startsWith('http://') || remote.uri.startsWith('https://'))) {
          try {
            const { downloadImageFromSupabase, getFileNameFromUrl } = await import('@/src/service/storageService');
            const fileName = getFileNameFromUrl(remote.uri);
            
            console.log(`Descargando imagen ${remote.id.substring(0, 8)}...`);
            localUri = await downloadImageFromSupabase(remote.uri, fileName);
            console.log(`Imagen descargada: ${localUri}`);
          } catch (error) {
            console.error(`Error descargando imagen ${remote.id}:`, error);
            localUri = remote.uri; // Mantener URL si falla
          }
        }
        
        // Insertar en BD con URI local
        await dao.insertPageImageFromRemote({
          ...remote,
          uri: localUri,
        });
      }
      // Si existe local pero tiene URL de Supabase, re-descargar
      else if (local && local.uri && (local.uri.startsWith('http://') || local.uri.startsWith('https://'))) {
        console.log(`Imagen local tiene URL de Supabase, re-descargando: ${local.id.substring(0, 8)}`);
        try {
          const { downloadImageFromSupabase, getFileNameFromUrl } = await import('@/src/service/storageService');
          const fileName = getFileNameFromUrl(local.uri);
          const localUri = await downloadImageFromSupabase(local.uri, fileName);
          
          console.log(`Imagen re-descargada: ${localUri}`);
          
          // Actualizar en BD
          await dao.insertPageImageFromRemote({
            ...local,
            uri: localUri,
          });
        } catch (error) {
          console.error(`Error re-descargando imagen ${local.id}:`, error);
        }
      }
    }

    console.log('Page images synced');
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

    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const localAudios = await dao.listAllPageAudiosForSync();
    console.log(`Audios locales: ${localAudios.length}`);

    const { data: remoteAudios, error } = await supabaseWithAuth
      .from('page_audios')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching remote audios:', error);
      throw error;
    }

    console.log(`Audios remotos: ${remoteAudios?.length || 0}`);

    const remoteMap = new Map(remoteAudios?.map(a => [a.id, a]) || []);

    // SUBIR audios locales
    for (const local of localAudios) {
      const remote = remoteMap.get(local.id);
      
      const shouldSync = !remote || 
                        local.deleted_at !== null || 
                        local.updated_at > remote.updated_at;
      
      if (shouldSync) {
        const status = local.deleted_at ? '(eliminado)' : '';
        console.log(`${status} Subiendo audio: ${local.id.substring(0, 8)}`);
        
        await supabaseWithAuth.from('page_audios').upsert({
          id: local.id,
          page_id: local.page_id,
          audio_uri: local.audio_uri,
          audio_type: local.audio_type,
          position_x: local.position_x,
          position_y: local.position_y,
          is_locked: local.is_locked ?? 0,
          created_at: local.created_at,
          updated_at: local.updated_at,
          user_id: this.userId,
          deleted_at: local.deleted_at || null,
        });
      }
    }

    const localMap = new Map(localAudios.map(a => [a.id, a]));
    
    // OBTENER IDS DE PÁGINAS VÁLIDAS
    const allLocalPages = await dao.listAllPagesForSync();
    const validPageIds = new Set(
      allLocalPages.filter(p => !p.deleted_at).map(p => p.id)
    );
    console.log(`Paginas locales validas para audios: ${validPageIds.size}`);
    
    for (const remote of remoteAudios || []) {
      // SKIP si la página no existe localmente
      if (!validPageIds.has(remote.page_id)) {
        console.log(`Saltando audio - pagina ${remote.page_id.substring(0, 8)} no existe`);
        continue;
      }
      
      const local = localMap.get(remote.id);
      
      if (remote.deleted_at) {
        if (local && !local.deleted_at) {  
          console.log('Eliminando audio local (borrado en remoto)');
          await dao.hardDeletePageAudio?.(remote.id);
        }
        continue;
      }
      
      // Descargar si no existe o si existe pero necesita actualización
      if (!local || remote.updated_at > local.updated_at) {
        console.log(`Procesando audio desde Supabase: ${remote.id.substring(0, 8)}`);
        
        let localUri = remote.audio_uri;
        
        // SIEMPRE descargar si es URL de Supabase
        if (remote.audio_uri && (remote.audio_uri.startsWith('http://') || remote.audio_uri.startsWith('https://'))) {
          try {
            const { downloadAudioFromSupabase, getFileNameFromUrl } = await import('@/src/service/storageService');
            const fileName = getFileNameFromUrl(remote.audio_uri);
            
            console.log(`Descargando audio ${remote.id.substring(0, 8)}...`);
            localUri = await downloadAudioFromSupabase(remote.audio_uri, fileName);
            console.log(`Audio descargado: ${localUri}`);
          } catch (error) {
            console.error(`Error descargando audio ${remote.id}:`, error);
            localUri = remote.audio_uri; // Mantener URL si falla
          }
        }
        
        // Insertar en BD con URI local
        await dao.insertPageAudioFromRemote({
          ...remote,
          audio_uri: localUri,
        });
      }
      // Si existe local pero tiene URL de Supabase, re-descargar
      else if (local && local.audio_uri && (local.audio_uri.startsWith('http://') || local.audio_uri.startsWith('https://'))) {
        console.log(`Audio local tiene URL de Supabase, re-descargando: ${local.id.substring(0, 8)}`);
        try {
          const { downloadAudioFromSupabase, getFileNameFromUrl } = await import('@/src/service/storageService');
          const fileName = getFileNameFromUrl(local.audio_uri);
          const localUri = await downloadAudioFromSupabase(local.audio_uri, fileName);
          
          console.log(`Audio re-descargado: ${localUri}`);
          
          // Actualizar en BD
          await dao.insertPageAudioFromRemote({
            ...local,
            audio_uri: localUri,
          });
        } catch (error) {
          console.error(`Error re-descargando audio ${local.id}:`, error);
        }
      }
    }

    console.log('Page audios synced');
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

    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const localTasks = await dao.listAllTasksForSync();
    console.log(`Tasks locales: ${localTasks.length}`);

    const { data: remoteTasks, error } = await supabaseWithAuth
      .from('tasks')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching remote tasks:', error);
      throw error;
    }

    console.log(`Tasks remotas: ${remoteTasks?.length || 0}`);

    const remoteMap = new Map(remoteTasks?.map(t => [t.id, t]) || []);

    // SUBIR tasks locales
    for (const local of localTasks) {
      const remote = remoteMap.get(local.id);
      
      const shouldSync = !remote || 
                        local.deleted_at !== null || 
                        local.updated_at > remote.updated_at;
      
      if (shouldSync) {
        const status = local.deleted_at ? '(eliminado)' : '';
        console.log(`${status} Subiendo task: ${local.title}`);
        
        await supabaseWithAuth.from('tasks').upsert({
          id: local.id,
          title: local.title,
          is_completed: local.is_completed,
          created_at: local.created_at,
          updated_at: local.updated_at,
          user_id: this.userId,
          deleted_at: local.deleted_at || null,
        });
      }
    }

    const localMap = new Map(localTasks.map(t => [t.id, t]));
    for (const remote of remoteTasks || []) {
      const local = localMap.get(remote.id);
      
      if (remote.deleted_at) {
        if (local && !local.deleted_at) {
          console.log(` Eliminando task local (borrada en remoto)`);
          await dao.hardDeleteTask?.(remote.id);
        }
        continue;
      }
      
      if (!local || remote.updated_at > local.updated_at) {
        console.log(`Descargando task: ${remote.title}`);
        await dao.insertTaskFromRemote(remote);
      }
    }

    console.log('Tasks synced successfully');
  } catch (error) {
    console.error(' Error syncing tasks:', error);
  }
}

  // ---------- SYNC COMPLETO ---------- 
  async performFullSync(): Promise<void> {
    console.log('Starting full sync...');
    
    try {
      await this.syncJournals();
      console.log('Journals sync completado');
      
      console.log(' Esperando 500ms antes de sincronizar páginas...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await this.syncPages();
      console.log('Pages sync completado');
      
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
      console.log(' Auto-sync stopped');
    }
  }

  // ---------- CLEANUP ---------- 
  destroy(): void {
    console.log(' SupabaseSync destroyed');
    
    this.stopAutoSync();
    
    if (this.supabase) {
      try {
        this.supabase.removeAllChannels();
        console.log('Canales de Supabase removidos');
      } catch (error) {
        console.error(' Error removiendo canales:', error);
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