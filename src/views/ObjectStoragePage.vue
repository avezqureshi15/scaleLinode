<template>
    <el-card class="container mx-auto" body-class="flex flex-col space-y-5">
        <div class="flex justify-between items-center">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/object-storage' }">Object Storage</el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <el-form label-position="left" class="filter-form flex flex-row space-x-4">
            <el-form-item label="Bucket">
                <el-select v-model="bucket" placeholder="Select Bucket">
                    <el-option
                    v-for="bucket in buckets"
                    :key="bucket.label"
                    :label="bucket.label"
                    :value="bucket"
                    ></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Region" style="width: 20rem;">
                <el-select v-model="region" placeholder="Select Region" filterable disabled>
                    <el-option v-for="region in regions" :key="region.id" :label="region.label+' ('+region.id+')'" :value="region.id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button class="w-full" type="primary" icon="Search" @click="fetchObjects">Fetch Objects</el-button>
            </el-form-item>
        </el-form>

        <div class="flex justify-between items-center mb-4">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item @click="goTo('')">
                    <div class="flex items-center space-x-2">
                        <el-icon><HomeFilled /></el-icon><b>{{ bucket.label }}</b>
                    </div>
                </el-breadcrumb-item>
                <template v-for="part in path.split('/')">
                    <el-breadcrumb-item @click="goTo(part+'/')" v-if="part"><b>{{ part }}</b></el-breadcrumb-item>
                </template>
            </el-breadcrumb>
            <el-button type="danger" icon="Delete" @click="confirmBulkDelete" :disabled="!selectedObjects.length">Bulk Delete</el-button>
        </div>

        <el-progress :percentage="progress" v-if="isBulkDeleting" status="active" />

        <el-table :data="objects" v-loading="loading" class="w-full" stripe @selection-change="handleSelectionChange" :default-sort="{prop: 'last_modified', order: 'descending'}">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column label="Object Name">
                <template #default="scope">
                    <p class="link" @click="goTo(scope.row.name)" v-if="scope.row.size === null">{{ scope.row.name }}</p>
                    <span v-else>{{ scope.row.name }}</span>
                </template>
            </el-table-column>
            <el-table-column label="Size" width="100" prop="size" sortable>
                <template #default="scope">
                    {{ formatSize(scope.row.size) }}
                </template>
            </el-table-column>
            <el-table-column prop="last_modified" label="Last modified" width="150" sortable>
                <template #default="scope">
                    {{ timeAgo(scope.row.last_modified) }}
                </template>
            </el-table-column>
            <el-table-column label="Actions" width="150" align="center">
                <template #default="scope">
                    <el-button type="success" icon="Download" size="small" @click="downloadObject(scope.row)" v-if="scope.row.size !== null"></el-button>
                    <el-button type="danger" icon="Delete" size="small" @click="scope.row.size === null ? confirmDeleteDirectory(scope.row.name) : confirmDeleteObject(scope.row.name)"></el-button>
                </template>
            </el-table-column>
        </el-table>

        <template #footer>
            <div class="flex flex-row justify-end w-full">
                <el-pagination
                layout="total, sizes, prev, pager, next, jumper"
                :page-sizes="[10, 20, 50, 100, 200, 300]"
                v-model:page-size="pageSize"
                v-model:current-page="currentPage"
                :total="totalObjects"
                @size-change="fetchObjects"
                @current-change="fetchObjects"
                class="flex justify-center"
                />
            </div>
        </template>
    </el-card>

    <el-dialog title="Delete Object" v-model="showDeleteObjectDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete this object?</p>
        <template #footer>
            <el-button @click="showDeleteObjectDialog = false">Cancel</el-button>
            <el-button type="danger" @click="deleteObject">Delete</el-button>
        </template>
    </el-dialog>

    <el-dialog title="Delete Directory" v-model="showDeleteDirectoryDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete this directory and all its contents?</p>
        <template #footer>
            <el-button @click="showDeleteDirectoryDialog = false">Cancel</el-button>
            <el-button type="danger" @click="deleteDirectory">Delete</el-button>
        </template>
    </el-dialog>

    <el-dialog title="Confirm Bulk Delete" v-model="showBulkDeleteDialog" class="bg-white rounded-md" append-to-body>
        <p>Are you sure you want to delete the selected objects?</p>
        <template #footer>
            <el-button @click="showBulkDeleteDialog = false">Cancel</el-button>
            <el-button type="danger" @click="performBulkDelete">Delete</el-button>
        </template>
    </el-dialog>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                loading: false,
                objects: [],
                totalObjects: 0,
                currentPage: 1,
                pageSize: 10,
                showDeleteObjectDialog: false,
                showDeleteDirectoryDialog: false,
                showBulkDeleteDialog: false,
                objectToDelete: null,
                directoryToDelete: null,
                regions: [],
                bucket: '',
                region: '',
                path: '',
                linodeToken: '',
                selectedObjects: [],
                selectAll: false,
                isBulkDeleting: false,
                progress: 0,
                buckets: []
            };
        },
        created() {
            this.linodeToken = localStorage.getItem('linodeToken');
            this.fetchRegions();
            this.fetchBuckets();
        },
        methods: {
            fetchBuckets() {
                this.loading = true;
                axios.get(`https://api.linode.com/v4/object-storage/buckets`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`
                    }
                })
                .then((response) => {
                    this.buckets = response.data.data;
                    if (this.buckets.length > 0) {
                        this.bucket = this.buckets[0];
                        this.region = this.bucket.region;
                        this.fetchObjects();
                    }
                })
                .catch((error) => {
                    console.error('Error fetching buckets:', error);
                    this.$message.error('Error fetching buckets');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchRegions() {
                this.loading = true;
                axios.get(`https://api.linode.com/v4/regions`)
                .then((response) => {
                    this.regions = response.data.data.filter(region => region.capabilities.includes("Linodes"))
                    .map(region => ({
                        id: region.id,
                        label: region.label,
                        country: region.country
                    }));
                })
                .catch((error) => {
                    console.error('Error fetching regions:', error);
                    this.$message.error('Error fetching regions');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            fetchObjects() {
                this.loading = true;
                this.region = this.bucket.region;
                if (!this.bucket || !this.region) {
                    this.$message.error('Please provide bucket, region, and path.');
                    return;
                }

                this.loading = true;
                axios.get(`${this.cloudApi}/api/v4/object-storage/buckets/${this.region}/${this.bucket.label}/object-list?delimiter=/&prefix=${this.path}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`
                    }
                })
                .then((response) => {
                    this.objects = response.data.data;
                    this.totalObjects = response.data.data.length;
                })
                .catch((error) => {
                    console.error('Error fetching objects:', error);
                    this.$message.error('Error fetching objects');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            goTo(path) {
                this.path = path;
                this.fetchObjects();
            },
            formatSize(size) {
                if (size === null) return 'Directory';
                if (size < 1024) return size + ' B';
                let i = Math.floor(Math.log(size) / Math.log(1024));
                return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
            },
            downloadObject(object) {
                axios.post(`${this.cloudApi}/api/v4/object-storage/buckets/${this.region}/${this.bucket.label}/object-url`, {
                    name: object.name,
                    method: 'GET',
                    content_disposition: 'attachment'
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then((response) => {
                    const url = response.data.url;
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = object.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })
                .catch((error) => {
                    console.error('Error downloading object:', error);
                    this.$message.error('Error downloading object');
                });
            },
            confirmDeleteObject(name) {
                this.objectToDelete = name;
                this.showDeleteObjectDialog = true;
            },
            confirmDeleteDirectory(name) {
                this.directoryToDelete = name;
                this.showDeleteDirectoryDialog = true;
            },
            deleteObject() {
                this.loading = true;
                axios.post(`${this.cloudApi}/api/v4/object-storage/buckets/${this.region}/${this.bucket.label}/object-url`, 
                {
                    name: this.objectToDelete,
                    method: 'DELETE'
                }, 
                {
                    headers: {
                        'Authorization': `Bearer ${this.linodeToken}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then((response) => {
                    const deleteUrl = response.data.url;
                    return axios.delete(deleteUrl, {
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                })
                .then(() => {
                    this.showDeleteObjectDialog = false;
                    this.fetchObjects();
                    this.$message.success('Object deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting object:', error);
                    this.$message.error('Error deleting object');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            deleteDirectory() {
                this.loading = true;
                this.isBulkDeleting = true;
                this.progress = 0;

                axios.get(`${this.cloudApi}/api/v4/object-storage/buckets/${this.region}/${this.bucket.label}/object-list?delimiter=/&prefix=${this.directoryToDelete}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`
                    }
                })
                .then((response) => {
                    const filesToDelete = response.data.data.filter(obj => obj.size !== null);

                    if (filesToDelete.length === 0) {
                        this.showDeleteDirectoryDialog = false;
                        this.$message.info('No files to delete in directory');
                        return;
                    }

                    const total = filesToDelete.length;
                    let completed = 0;

                    const deleteRequests = filesToDelete.map(file => 
                        axios.post(`${this.cloudApi}/api/v4/object-storage/buckets/${this.region}/${this.bucket.label}/object-url`, 
                        {
                            name: file.name,
                            method: 'DELETE'
                        }, 
                        {
                            headers: {
                                'Authorization': `Bearer ${this.linodeToken}`,
                                'Content-Type': 'application/json'
                            }
                        })
                        .then((response) => {
                            const deleteUrl = response.data.url;
                            return axios.delete(deleteUrl, {
                                headers: {
                                    'Accept': 'application/json',
                                }
                            });
                        })
                        .then(() => {
                            completed++;
                            this.progress = Math.round((completed / total) * 100);
                        })
                        .catch((error) => {
                            console.error('Error deleting file:', error);
                            this.$message.error('Error deleting files');
                        })
                        );

                    return Promise.all(deleteRequests);
                })
                .then(() => {
                    this.isBulkDeleting = false;
                    this.progress = 0;
                    this.showDeleteDirectoryDialog = false;
                    this.fetchObjects();
                    this.$message.success('Directory deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting directory:', error);
                    this.$message.error('Error deleting directory');
                    this.isBulkDeleting = false;
                    this.progress = 0;
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            confirmBulkDelete() {
                if (this.selectedObjects.length === 0) {
                    this.$message.error('No objects selected for deletion.');
                    return;
                }
                this.showBulkDeleteDialog = true;
            },
            performBulkDelete() {
                this.showBulkDeleteDialog = false;
                this.isBulkDeleting = true;
                this.progress = 0;
                const total = this.selectedObjects.length;
                let completed = 0;
                const deleteRequests = this.selectedObjects.map(object => 
                    axios.post(`${this.cloudApi}/api/v4/object-storage/buckets/${this.region}/${this.bucket.label}/object-url`, 
                    {
                        name: object.name,
                        method: 'DELETE'
                    }, 
                    {
                        headers: {
                            'Authorization': `Bearer ${this.linodeToken}`,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then((response) => {
                        const deleteUrl = response.data.url;
                        return axios.delete(deleteUrl, {
                            headers: {
                                'Accept': 'application/json',
                            }
                        });
                    })
                    .then(() => {
                        completed++;
                        this.progress = Math.round((completed / total) * 100);
                    })
                    .catch((error) => {
                        console.error('Error deleting object:', error);
                        this.$message.error('Error deleting objects');
                    })
                    );

                Promise.all(deleteRequests)
                .then(() => {
                    this.isBulkDeleting = false;
                    this.progress = 0;
                    this.fetchObjects();
                    this.$message.success('Objects deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting objects:', error);
                    this.$message.error('Error deleting objects');
                    this.isBulkDeleting = false;
                    this.progress = 0;
                });
            },
            handleSelectionChange(selected) {
                this.selectedObjects = selected;
            },
            toggleSelectAll() {
                this.selectAll = !this.selectAll;
                if (this.selectAll) {
                    this.selectedObjects = [...this.objects];
                } else {
                    this.selectedObjects = [];
                }
            },
        },
    }
</script>
<style>
    .filter-form .el-form-item {
        width: 30%;
    }
</style>
