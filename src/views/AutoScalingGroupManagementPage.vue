<template>
    <div class="flex flex-col space-y-5">
        <el-card class="container mx-auto" body-class="flex flex-col space-y-10">
            <div class="flex justify-between items-center">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item :to="{ path: '/auto-scaling-groups' }">Auto Scaling Groups</el-breadcrumb-item>
                    <el-breadcrumb-item>{{ activeASG.name }}</el-breadcrumb-item>
                    <el-breadcrumb-item>Management</el-breadcrumb-item>
                </el-breadcrumb>
            </div>
        </el-card>
        <el-tabs v-model="activeTab" type="border-card" stretch>
            <el-tab-pane name="asgDetails">
                <template #label>
                    <div class="flex flex-row justify-between items-center w-full">
                        <p>ASG Details</p>
                        <el-tooltip content="Refresh" placement="bottom">
                            <el-button v-if="activeTab == 'asgDetails'" type="success" icon="Refresh" size="small" circle @click="refreshASGDetails()"></el-button>
                        </el-tooltip>
                    </div>
                </template>
                <div class="grid grid-cols-2 gap-5">
                    <!-- ASG Information -->
                    <div class="bg-white rounded shadow-lg h-full">
                        <div class="flex items-center bg-blue-500 text-white p-4 rounded-t">
                            <el-icon class="mr-2"><Monitor /></el-icon>
                            <span class="text-xl font-semibold">ASG Details</span>
                        </div>
                        <div class="space-y-2">
                            <el-descriptions :column="1" border>
                                <el-descriptions-item label="ASG ID">{{ activeASG.id }}</el-descriptions-item>
                                <el-descriptions-item label="Name">{{ activeASG.name }}</el-descriptions-item>
                                <el-descriptions-item label="Date Created">{{ formatDate(activeASG.created_at) }}</el-descriptions-item>
                                <el-descriptions-item label="Node Balancer IP">
                                    <div v-if="activeASG.nodebalancer_ip != 'not_assigned'" class="flex items-center space-x-2">
                                        <a class="underline text-blue-500" target="_BLANK" :href="'http://'+activeASG.nodebalancer_ip">{{ activeASG.nodebalancer_ip }}</a>
                                        <el-tooltip content="Copy" placement="right">
                                            <el-icon class="cursor-pointer" @click="copyContent(activeASG.nodebalancer_ip)"><CopyDocument /></el-icon>
                                        </el-tooltip>
                                    </div>
                                    <p v-else>NA</p>
                                </el-descriptions-item>
                                <el-descriptions-item label="State">
                                    <el-tag type="success" v-if="activeASG.state == 'RUNNING'">{{ activeASG.state }}</el-tag>
                                    <el-tag type="warning" v-else-if="activeASG.state == 'REFRESHING'">{{ activeASG.state }}</el-tag>
                                    <el-tag type="danger" v-else-if="activeASG.state == 'IN_ROLLBACK'">{{ activeASG.state }}</el-tag>
                                    <el-tag type="info" v-else>{{ activeASG.state }}</el-tag>
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>
                    </div>
                    <!-- Capacity Information -->
                    <div class="bg-white rounded shadow-lg h-full">
                        <div class="flex items-center bg-green-500 text-white p-4 rounded-t">
                            <el-icon class="mr-2"><Connection /></el-icon>
                            <span class="text-xl font-semibold">Capacity Settings</span>
                        </div>
                        <div class="space-y-2">
                            <el-descriptions :column="1" border>
                                <el-descriptions-item label="Min Desired Capacity">{{ activeASG.min_desired_capacity }}</el-descriptions-item>
                                <el-descriptions-item label="Max Desired Capacity">{{ activeASG.max_desired_capacity }}</el-descriptions-item>
                                <el-descriptions-item label="Stale Instance Time">NA</el-descriptions-item>
                                <el-descriptions-item label="VPC" v-if="activeASG.vpc_id">{{ activeASG.vpc_id }}</el-descriptions-item>
                                <el-descriptions-item label="Subnet" v-if="activeASG.subnet_id">{{ activeASG.subnet_id }}</el-descriptions-item>
                            </el-descriptions>
                        </div>
                    </div>
                    <!-- Performance Thresholds -->
                    <div class="bg-white rounded shadow-lg h-full">
                        <div class="flex items-center bg-purple-500 text-white p-4 rounded-t">
                            <el-icon class="mr-2"><Cpu /></el-icon>
                            <span class="text-xl font-semibold">Performance Thresholds</span>
                        </div>
                        <div class="space-y-2">
                            <el-descriptions :column="1" border>
                                <el-descriptions-item label="CPU Threshold">
                                    <el-progress :percentage="activeASG.cpu_threshold" :format="(val) => val + '%'"></el-progress>
                                </el-descriptions-item>
                                <el-descriptions-item label="Memory Threshold">
                                    <el-progress :percentage="activeASG.memory_threshold" :format="(val) => val + '%'" :color="customColors"></el-progress>
                                </el-descriptions-item>
                                <el-descriptions-item label="Network-In Threshold">
                                    <p class="text-right">{{ activeASG.network_threshold }} bytes</p>
                                </el-descriptions-item>
                                <el-descriptions-item label="Network Control Period">
                                    <p class="text-right">{{ activeASG.control_loop_period }} seconds</p>
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>
                    </div>
                    <!-- Launch Template Information -->
                    <div class="bg-white rounded shadow-lg h-full">
                        <div class="flex items-center bg-yellow-500 text-white p-4 rounded-t">
                            <el-icon class="mr-2"><Document /></el-icon>
                            <span class="text-xl font-semibold">Launch Template</span>
                        </div>
                        <div class="space-y-2">
                            <el-descriptions :column="1" border>
                                <el-descriptions-item label="Launch Template ID">{{ activeASG.lt_id }}</el-descriptions-item>
                                <el-descriptions-item label="Launch Template Version">{{ activeASG.lt_version }}</el-descriptions-item>
                                <el-descriptions-item label="Use SSL">
                                    <el-tag type="success" v-if="activeASG.use_https">YES</el-tag>
                                    <el-tag type="danger" v-else>NO</el-tag>
                                </el-descriptions-item>
                                <el-descriptions-item v-if="activeASG.use_https" label="SSL Certificate">
                                    <p>{{ credentials.find(credential => credential.id === activeASG.ssl_certificate_cred_id)?.name ?? activeASG.ssl_certificate_cred_id }}</p>
                                </el-descriptions-item>
                                <el-descriptions-item v-if="activeASG.use_https" label="SSL Private Key">
                                    <p>{{ credentials.find(credential => credential.id === activeASG.private_key_cred_id)?.name ?? activeASG.private_key_cred_id }}</p>
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row mt-4 w-full">
                    <el-card class="w-full">
                        <div class="w-full flex flex-col space-y-2">
                            <span class="font-semibold">ASG Refresh Webhook URL</span>
                            <el-input v-model="activeASG.complete_webhook_url" disabled class="webhook-input">
                                <template #append>
                                    <el-button @click="copyToClipboard" type="primary" icon="Copy">Copy</el-button>
                                </template>
                            </el-input>
                        </div>
                    </el-card>
                </div>
            </el-tab-pane>
            <el-tab-pane name="activityLogs">
                <template #label>
                    <div class="flex flex-row justify-between items-center w-full">
                        <p>Activity Logs</p>
                        <el-tooltip content="Refresh" placement="bottom">
                            <el-button v-if="activeTab == 'activityLogs'" type="success" icon="Refresh" size="small" circle @click="refreshActivityLogs()"></el-button>
                        </el-tooltip>
                    </div>
                </template>
                <!-- Filters -->
                <div class="flex flex-row space-x-4 mb-4">
                    <div class="w-1/3">
                        <el-input v-model="logFilter.event" placeholder="Filter by Event" clearable @input="refreshActivityLogs"></el-input>
                    </div>
                    <div class="w-1/3">
                        <el-select v-model="logFilter.level" placeholder="Filter by Level" clearable @change="refreshActivityLogs">
                            <el-option label="SUCCESS" value="SUCCESS"></el-option>
                            <el-option label="ERROR" value="ERROR"></el-option>
                            <el-option label="WARNING" value="WARNING"></el-option>
                            <el-option label="INFO" value="INFO"></el-option>
                        </el-select>
                    </div>
                    <div class="w-1/3">
                        <el-date-picker
                        class="w-full block"
                        v-model="logFilter.timeRange"
                        type="datetimerange"
                        range-separator="To"
                        start-placeholder="Start date"
                        end-placeholder="End date"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        clearable
                        @change="refreshActivityLogs()"
                        ></el-date-picker>
                    </div>
                    <div class="w-1/12">
                        <el-button type="primary" icon="Filter" @click="refreshActivityLogs()">Filter</el-button>
                    </div>
                </div>
                <el-table :data="activityLogs" v-loading="loading" class="w-full" stripe size="small">
                    <!-- <el-table-column prop="id" label="ID" /> -->
                    <el-table-column prop="event" label="Event" />
                    <!-- <el-table-column prop="log" label="Log" /> -->
                    <el-table-column prop="short_description" label="Short Description" />
                    <el-table-column prop="level" label="Level" align="center" width="100">
                        <template #default="scope">
                            <el-tag type="success" v-if="scope.row.level == 'SUCCESS'">{{ scope.row.level }}</el-tag>
                            <el-tag type="error" v-else-if="scope.row.level == 'ERROR'">{{ scope.row.level }}</el-tag>
                            <el-tag type="warning" v-else-if="scope.row.level == 'WARNING'">{{ scope.row.level }}</el-tag>
                            <el-tag type="info" v-else>{{ scope.row.level }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="Timestamp" width="150" align="center">
                        <template #default="scope">
                            {{ timeAgo(scope.row.timestamp) }}
                        </template>
                    </el-table-column>
                </el-table>
                <br>
                <div class="flex flex-row justify-end w-full">
                    <el-pagination
                    layout="total, sizes, prev, pager, next, jumper"
                    :page-sizes="[10, 20, 50, 100, 200, 300]"
                    v-model:page-size="pageSize"
                    v-model:current-page="currentPage"
                    :total="totalActivityLogs"
                    @size-change="refreshActivityLogs"
                    @current-change="refreshActivityLogs"
                    class="flex justify-center"
                    />
                </div>
            </el-tab-pane>
            <el-tab-pane name="linodes">
                <template #label>
                    <div class="flex flex-row justify-between items-center w-full">
                        <p>Linodes</p>
                        <div class="flex flex-row" v-if="activeTab == 'linodes'">
                            <el-tooltip content="Refresh" placement="bottom">
                                <el-button type="success" icon="Refresh" size="small" circle @click="fetchLinodes"></el-button>
                            </el-tooltip>
                            <!-- <el-tooltip content="Tag Linodes" placement="bottom">
                                <el-button type="primary" @click="addTagToLinodes" size="small" circle icon="CollectionTag"></el-button>
                            </el-tooltip> -->
                        </div>
                    </div>
                </template>
                <el-table :data="linodes" v-loading="loading" class="w-full" stripe size="small">
                    <el-table-column prop="id" label="ID" width="100">
                        <template #default="scope">
                            <a class="underline text-blue-500" target="_BLANK" :href="'https://cloud.linode.com/linodes/'+scope.row.id" >{{ scope.row.id }}</a>
                        </template>
                    </el-table-column>
                    <el-table-column prop="label" label="Label" />
                    <el-table-column prop="status" label="Status" align="center">
                        <template #default="scope">
                            <el-tag type="success" v-if="scope.row.status == 'running'">{{ scope.row.status }}</el-tag>
                            <el-tag type="warning" v-else-if="scope.row.status == 'provisioning'">{{ scope.row.status }}</el-tag>
                            <el-tag type="info" v-else>{{ scope.row.status }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="type" label="Type" width="150"/>
                    <el-table-column label="IPv4" width="120">
                        <template #default="scope">
                            <div class="flex flex-col">
                                <a class="underline text-blue-500" target="_BLANK" :href="'http://'+ip" v-for="ip in scope.row.ipv4">{{ ip }}</a>
                            </div>
                        </template>
                    </el-table-column>
                    <!-- <el-table-column prop="ipv6" label="ipv6" /> -->
                    <!-- <el-table-column prop="image" label="image" /> -->
                    <!-- <el-table-column prop="region" label="region" /> -->
                    <!-- <el-table-column prop="updated" label="Updated" /> -->
                    <el-table-column label="Created" width="100">
                        <template #default="scope">
                            {{ timeAgo(scope.row.created) }}
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
            <el-tab-pane name="instanceRefresh">
                <template #label>
                    <div class="flex flex-row justify-between items-center w-full">
                        <p>Instance Refresh</p>
                        <el-tooltip content="Refresh" placement="bottom">
                            <el-button v-if="activeTab == 'instanceRefresh'" type="success" icon="Refresh" size="small" circle @click="refreshInstanceRefresh()"></el-button>
                        </el-tooltip>
                    </div>
                </template>
                <div class="flex justify-end mb-4">
                    <el-button type="primary" @click="confirmInstanceRefresh">Initialize Instance Refresh</el-button>
                </div>
                <div class="bg-white rounded shadow-lg h-full mb-4" v-if="webhookResponse.job_id">
                    <div class="flex items-center bg-red-500 text-white p-4 rounded-t">
                        <el-icon class="mr-2"><Document /></el-icon>
                        <span class="text-xl font-semibold">Instance Refresh Webhook Response</span>
                    </div>
                    <div class="space-y-2">
                        <el-descriptions :column="1" border>
                            <el-descriptions-item label="Job ID">{{ webhookResponse.job_id }}</el-descriptions-item>
                            <el-descriptions-item label="State">{{ webhookResponse.state }}</el-descriptions-item>
                            <el-descriptions-item label="Created at">{{ webhookResponse.created_at }}</el-descriptions-item>
                        </el-descriptions>
                    </div>
                </div>
                <el-table :data="refreshLogs" v-loading="loading" class="w-full" stripe size="small">
                    <el-table-column prop="id" label="ID" />
                    <el-table-column label="Status" align="center">
                        <template #default="scope">
                            <el-tag type="success" v-if="scope.row.status == 'COMPLETED'">{{ scope.row.status }}</el-tag>
                            <el-tag type="error" v-else-if="scope.row.status == 'FAILED'">{{ scope.row.status }}</el-tag>
                            <el-tag type="info" v-else>{{ scope.row.status }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="Required Refresh" align="center">
                        <template #default="scope">
                            <el-tag type="success" v-if="scope.row.required_refresh">Yes</el-tag>
                            <el-tag type="error" v-else>Yes</el-tag>
                        </template>
                    </el-table-column>
                    <!-- <el-table-column label="Start Time" align="center">
                        <template #default="scope">
                            {{ formatDate(scope.row.start_time.Time) }}
                        </template>
                    </el-table-column> -->
                    <!-- <el-table-column label="End Time" align="center">
                        <template #default="scope">
                            {{ formatDate(scope.row.end_time.Time) }}
                        </template>
                    </el-table-column> -->
                    <el-table-column label="Created" align="center">
                        <template #default="scope">
                            {{ formatDate(scope.row.created_time.Time) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="Updated" align="center">
                        <template #default="scope">
                            {{ formatDate(scope.row.updated_time.Time) }}
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                loading: false,
                activeTab: 'asgDetails',
                activeASG: {
                    name: '',
                    dateCreated: '',
                    nodeBalancerIP: '',
                    minDesiredCapacity: 0,
                    maxDesiredCapacity: 0,
                    staleInstanceAttachedTime: '',
                    cpuThreshold: 0,
                    memoryThreshold: 0,
                    launchTemplateId: '',
                },
                activityLogs: [],
                webhookResponse: {
                    job_id: '',
                    state: '',
                    created_at: '',
                },
                refreshLogs: [],
                linodes: [],
                pageSize: 1,
                currentPage: 1,
                totalActivityLogs: 0,
                logFilter: {
                    event: '',
                    level: '',
                    timeRange: '',
                },
                customColors: [
                    { color: '#f56c6c', percentage: 20 },
                    { color: '#e6a23c', percentage: 40 },
                    { color: '#5cb87a', percentage: 60 },
                    { color: '#1989fa', percentage: 80 },
                    { color: '#6f7ad3', percentage: 100 }
                    ],
            };
        },
        created() {
            this.asgId = "asg:" + this.$route.params.asgId;
            this.fetchCredentials();
            this.fetchActiveASG();
            this.fetchActivityLogs();
            this.refreshInstanceRefresh();
            this.setRefreshInterval();
        },
        beforeDestroy() {
            this.clearRefreshInterval();
        },
        methods: {
            fetchCredentials() {
                this.loading = true;
                this.makeRequest('post', 'artillery-service/v1/credential.list')
                .then((response) => {
                    this.credentials = response.data.results;
                    this.totalCredentials = this.credentials.length;
                    const linodeToken = this.credentials.find(credential => credential.name === 'LINODE_TOKEN');
                    if (linodeToken) {
                        this.linodeToken = linodeToken.value;
                    }
                })
                .catch((error) => {
                    console.error('Server responded with an error:', error);
                    this.$message.error('Error fetching credentials');
                })
                .finally(() => {
                    this.loading = false;
                    this.fetchLinodes();
                });
            },
            setRefreshInterval() {
                this.refreshInterval = setInterval(() => {
                    this.refreshActivityLogs();
                }, 60000); // 60000 ms = 1 minute
            },
            clearRefreshInterval() {
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                }
            },
            fetchActiveASG() {
                this.loading = true;
                this.makeRequest('post', 'asg-service/v1/asg.describe', { asg_id: this.asgId })
                .then((response) => {
                    this.activeASG = response.data;
                    this.activeASG.complete_webhook_url = `${this.apiUrl}v1/integrations${response.data.webhook_url}`;
                })
                .catch((error) => {
                    console.error('Error fetching ASG details:', error);
                    this.$message.error('Error fetching ASG details');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            refreshASGDetails() {
                this.fetchActiveASG();
            },
            fetchActivityLogs() {
                this.loading = true;
                this.makeRequest('post', 'asg-service/v1/asg.listLogs', { 
                    asg_id: this.asgId,
                    page: this.currentPage,
                    limit: this.pageSize,
                    event: this.logFilter.event,
                    level: this.logFilter.level,
                    timefrom: (this.logFilter.timeRange) ? this.logFilter.timeRange[0]+'Z' : '',
                    timeto: (this.logFilter.timeRange) ? this.logFilter.timeRange[1]+'Z' : '',
                })
                .then((response) => {
                    this.activityLogs = response.data.results;
                    this.pageSize = response.data.Limit;
                    this.currentPage = response.data.Page;
                    this.totalActivityLogs = response.data.totalRecords;
                })
                .catch((error) => {
                    console.error('Error fetching activity logs:', error);
                    this.$message.error('Error fetching activity logs');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            refreshActivityLogs() {
                this.fetchActivityLogs();
            },
            refreshInstanceRefresh() {
                this.loading = true;
                this.makeRequest('post', 'asg-service/v1/asg-refresh.list', { asg_id: this.asgId })
                .then((response) => {
                    this.refreshLogs = response.data.results;
                })
                .catch((error) => {
                    console.error('Error fetching refresh logs:', error);
                    this.$message.error('Error fetching refresh logs');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            createInstanceRefresh() {
                this.loading = true;
                this.makeRequest('post', 'v1/integrations' + this.activeASG.webhook_url)
                .then((response) => {
                    this.webhookResponse = response.data;
                    this.$message.success('Instance Refresh request created successfully');
                    this.refreshInstanceRefresh();
                })
                .catch((error) => {
                    console.error('Error creating Instance Refresh:', error);
                    this.$message.error('Error creating Instance Refresh');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            confirmInstanceRefresh() {
                this.$confirm('Are you sure you want to start an instance refresh?', 'Confirm Instance Refresh', {
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    type: 'warning'
                }).then(() => {
                    this.createInstanceRefresh();
                }).catch(() => {
                    this.$message.info('Instance Refresh canceled');
                });
            },
            fetchLinodes() {
                this.loading = true;
                axios.get('https://api.linode.com/v4/linode/instances?page=1&page_size=500', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${this.linodeToken}`
                    }
                })
                .then((response) => {
                    this.linodes = response.data.data.filter(linode => linode.label.includes(this.activeASG.id.replace("asg:", "")));
                })
                .catch((error) => {
                    console.error('Error fetching linodes:', error);
                    this.$message.error('Error fetching linodes');
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            addTagToLinodes() {
                this.linodes.forEach(linode => {
                    if (!linode.tags.includes(this.activeASG.name)) {
                        axios.put(`${this.cloudApi}/api/v4/linode/instances/${linode.id}`, {
                            tags: linode.tags.concat(this.activeASG.name)
                        }, {
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${this.linodeToken}`
                            }
                        })
                        .then(() => {
                            this.$message.success(`Tagged Linode ${linode.id} successfully`);
                        })
                        .catch(error => {
                            console.error(`Error tagging Linode ${linode.id}:`, error);
                            this.$message.error(`Error tagging Linode ${linode.id}`);
                        });
                    }
                });
            },
            formatDate(date) {
                const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
                return new Date(date).toLocaleDateString(undefined, options);
            },
            copyToClipboard() {
                this.copyContent(this.activeASG.complete_webhook_url);
            }
        },
    };
</script>
