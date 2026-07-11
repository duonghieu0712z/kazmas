use std::{collections::HashMap, future::Future, path::Path};

use tokio::sync::Mutex;
use uuid::Uuid;

use crate::{
    app::{KazmasError, KazmasResult},
    model::{Document, Node, NodeKind, NodeMetadata},
    world::{WorldManifest, WorldProject},
};

#[derive(Default)]
pub(crate) struct ProjectManager {
    projects: Mutex<HashMap<Uuid, WorldProject>>,
}

impl ProjectManager {
    pub(crate) async fn world_manifest(&self, id: Uuid) -> KazmasResult<Option<WorldManifest>> {
        let projects = self.projects.lock().await;
        let project = projects.get(&id);
        let manifest = project.map(|p| p.manifest());
        Ok(manifest)
    }

    pub(crate) async fn project_dirty(&self, id: Uuid) -> Option<bool> {
        let projects = self.projects.lock().await;
        projects.get(&id).map(|project| project.is_dirty())
    }

    pub(crate) async fn open_project_or_close<T>(
        &self,
        project: WorldProject,
        action: impl Future<Output = KazmasResult<T>>,
    ) -> KazmasResult<T> {
        let project_id = project.id();
        self.open_project(project).await?;

        let result = action.await;
        if let Err(error) = result {
            if let Err(cleanup_error) = self.close_project(project_id).await {
                return Err(KazmasError::Invalid(format!(
                    "{error}; cleanup failed: {cleanup_error}"
                )));
            }
            return Err(error);
        }
        result
    }

    async fn open_project(&self, project: WorldProject) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        let project_id = project.id();
        if projects.contains_key(&project_id) {
            return Err(KazmasError::AlreadyExists(format!(
                "project {project_id} is already open"
            )));
        }

        projects.insert(project_id, project);
        Ok(())
    }

    pub(crate) async fn save_project(&self, id: Uuid) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            project.save_world().await?;
        }

        Ok(())
    }

    pub(crate) async fn save_project_as(
        &self,
        id: Uuid,
        path: impl AsRef<Path>,
    ) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            project.save_world_as(path).await?;
        }

        Ok(())
    }

    pub(crate) async fn close_project(&self, id: Uuid) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.remove(&id) {
            project.close_world().await?;
        }

        Ok(())
    }

    pub(crate) async fn get_node(&self, id: Uuid, node_id: Uuid) -> KazmasResult<Option<Node>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.get_node(node_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn get_manuscripts(&self, id: Uuid) -> KazmasResult<Option<Vec<Node>>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project
                .get_node_descendants_by_kind(NodeKind::Manuscript)
                .await
                .map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn get_wikis(&self, id: Uuid) -> KazmasResult<Option<Vec<Node>>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project
                .get_node_descendants_by_kind(NodeKind::Wiki)
                .await
                .map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn get_metadata(
        &self,
        id: Uuid,
        node_id: Uuid,
    ) -> KazmasResult<Option<NodeMetadata>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.get_metadata(node_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn get_document(
        &self,
        id: Uuid,
        node_id: Uuid,
    ) -> KazmasResult<Option<Document>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.get_document(node_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn create_folder(
        &self,
        id: Uuid,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Option<Uuid>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.create_folder(name, parent_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn create_manuscript_entry(
        &self,
        id: Uuid,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Option<Uuid>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project
                .create_manuscript_entry(name, parent_id)
                .await
                .map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn create_wiki_entry(
        &self,
        id: Uuid,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Option<Uuid>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.create_wiki_entry(name, parent_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn update_node(&self, id: Uuid, node: &Node) -> KazmasResult<Option<bool>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.update_node(node).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn update_metadata(
        &self,
        id: Uuid,
        metadata: &NodeMetadata,
    ) -> KazmasResult<Option<bool>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.update_metadata(metadata).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn update_document(
        &self,
        id: Uuid,
        document: &Document,
    ) -> KazmasResult<Option<bool>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.update_document(document).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn delete_node(&self, id: Uuid, node_id: Uuid) -> KazmasResult<Option<bool>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.delete_node(node_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn restore_node(&self, id: Uuid, node_id: Uuid) -> KazmasResult<Option<bool>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.restore_node(node_id).await.map(Some);
        }
        Ok(None)
    }

    pub(crate) async fn purge_node(&self, id: Uuid, node_id: Uuid) -> KazmasResult<Option<bool>> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(&id) {
            return project.purge_node(node_id).await.map(Some);
        }
        Ok(None)
    }
}
