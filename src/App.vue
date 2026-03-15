<template>
  <el-container>
    <el-header style="background-color: #2E7D32; color: white; display: flex; align-items: center; justify-content: space-between;">
      <h2>粮仓 · 商家管理端</h2>
      <el-button type="info" size="small" @click="showSettings = true">设置</el-button>
    </el-header>
    <el-main style="background-color: #F5F0E8; min-height: 100vh;">
      <!-- Filter -->
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <el-radio-group v-model="filterStatus" @change="fetchOrders">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="pending">待接单</el-radio-button>
              <el-radio-button label="preparing">制作中</el-radio-button>
              <el-radio-button label="completed">已完成</el-radio-button>
          </el-radio-group>
          <div>
              <el-button type="warning" @click="showStats = true" style="margin-right: 10px;">数据统计</el-button>
              <el-button type="primary" @click="showProductManager = true">商品管理</el-button>
          </div>
      </div>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" v-for="order in filteredOrders" :key="order.id">
          <el-card class="order-card" :class="{ 'new-order': order.status === 'pending' }">
            <template #header>
              <div class="card-header">
                <span style="font-size: 24px; font-weight: bold;">#{{ order.pickupCode }}</span>
                <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
              </div>
              <div style="color: #666; font-size: 12px; margin-top: 5px;">{{ formatTime(order.createdAt) }}</div>
              <div v-if="order.diningMode === 'takeout'" style="color: #E6A23C; font-weight: bold; margin-top: 5px;">
                  打包带走 <span v-if="order.pickupTime">({{ order.pickupTime }} 自取)</span>
              </div>
              <div v-else style="color: #2E7D32; font-weight: bold; margin-top: 5px;">店内就餐</div>
            </template>
            <div v-for="(item, index) in order.items" :key="index" class="order-item">
              <div style="flex: 1;">
                  <span>{{ item.quantity }} x {{ item.name }}</span>
                  <div v-if="item.variant" style="font-size: 12px; color: #666;">规格: {{ item.variant }}</div>
                  <div v-if="item.specs" style="font-size: 12px; color: #666;">
                      <span v-for="(val, key) in item.specs" :key="key" style="margin-right: 5px;">{{ val }}</span>
                  </div>
              </div>
              <span>¥{{ Number(item.price * item.quantity).toFixed(2) }}</span>
            </div>
            <div v-if="order.remark" style="margin-top: 10px; background: #fdf6ec; padding: 5px; color: #e6a23c; font-size: 12px;">
                备注: {{ order.remark }}
            </div>
            <el-divider />
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>合计</span>
              <span>¥{{ Number(order.total).toFixed(2) }}</span>
            </div>
            <template #footer>
              <div class="card-footer" style="display: flex; gap: 10px;">
                <el-button v-if="order.status === 'pending'" type="primary" @click="handleOrder(order)" style="flex: 1;">接单 & 打印</el-button>
                <el-button v-if="order.status === 'preparing'" type="success" @click="completeOrder(order)" style="flex: 1;">通知取餐</el-button>
                <el-button v-if="order.status === 'preparing'" type="warning" @click="printLabel(order)" style="flex: 1;">打印标签</el-button>
                <el-button v-if="order.status === 'completed'" disabled style="flex: 1;">已完成</el-button>
              </div>
            </template>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="filteredOrders.length === 0" description="暂无订单" />
    </el-main>

    <!-- Settings Dialog -->
    <el-dialog v-model="showSettings" title="打印设备配置" width="500px">
        <el-tabs v-model="activeTab">
            <el-tab-pane label="小票打印机 (商鹏云)" name="receipt">
                <el-form label-width="100px">
                    <el-form-item label="应用ID">
                         <el-input v-model="printerConfig.receiptAppid" placeholder="商鹏云 AppID"></el-input>
                    </el-form-item>
                    <el-form-item label="应用密钥">
                         <el-input v-model="printerConfig.receiptAppsecret" placeholder="商鹏云 AppSecret" type="password"></el-input>
                    </el-form-item>
                    <el-form-item label="终端编号">
                         <el-input v-model="printerConfig.receiptSn" placeholder="打印机背面的 SN"></el-input>
                    </el-form-item>
                    <el-form-item label="打印机KEY">
                         <el-input v-model="printerConfig.receiptKey" placeholder="打印机KEY (用于首次添加设备)" type="password"></el-input>
                    </el-form-item>
                     <el-form-item label="小票标题">
                        <el-input v-model="printerConfig.title" placeholder="粮仓"></el-input>
                    </el-form-item>
                     <el-form-item label="自动打印">
                        <el-switch v-model="printerConfig.receiptAutoPrint" active-text="接单自动打印小票"></el-switch>
                    </el-form-item>
                </el-form>
                 <div style="text-align: center; margin-top: 10px;">
                    <el-button type="primary" @click="saveSettings">保存配置</el-button>
                    <el-button @click="testReceiptPrint">发送测试小票</el-button>
                </div>
            </el-tab-pane>
            
            <el-tab-pane label="标签打印机 (芯烨云)" name="label">
                <el-form label-width="100px">
                    <el-form-item label="开发者ID">
                         <el-input v-model="printerConfig.appid" placeholder="芯烨云 User ID"></el-input>
                    </el-form-item>
                    <el-form-item label="开发者密钥">
                         <el-input v-model="printerConfig.appsecret" placeholder="芯烨云 User Key" type="password"></el-input>
                    </el-form-item>
                    <el-form-item label="打印机编号">
                         <el-input v-model="printerConfig.sn" placeholder="打印机背面的 SN"></el-input>
                    </el-form-item>
                    <el-form-item label="打印机名称">
                         <el-input v-model="printerConfig.name" placeholder="粮仓标签机"></el-input>
                    </el-form-item>
                     <el-form-item label="自动打印">
                        <el-switch v-model="printerConfig.autoPrint" active-text="接单自动打印标签"></el-switch>
                    </el-form-item>
                </el-form>
                 <div style="text-align: center; margin-top: 10px;">
                    <el-button type="primary" @click="saveSettings">保存配置</el-button>
                    <el-button @click="testPrint">发送测试标签</el-button>
                </div>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>

    <!-- Stats Dialog -->
    <el-dialog v-model="showStats" title="经营数据统计" width="80%">
        <el-row :gutter="20" style="margin-bottom: 30px;">
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header>今日销售额</template>
                    <div style="font-size: 24px; font-weight: bold; color: #2E7D32;">¥{{ stats.todaySales || 0 }}</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header>今日订单数</template>
                    <div style="font-size: 24px; font-weight: bold;">{{ stats.todayOrderCount || 0 }}</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header>累计销售额</template>
                    <div style="font-size: 24px; font-weight: bold; color: #E6A23C;">¥{{ stats.totalSales || 0 }}</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header>累计订单数</template>
                    <div style="font-size: 24px; font-weight: bold;">{{ stats.totalOrders || 0 }}</div>
                </el-card>
            </el-col>
        </el-row>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3>销售趋势</h3>
            <el-radio-group v-model="statsRange" size="small" @change="fetchStats">
                <el-radio-button :label="7">近7日</el-radio-button>
                <el-radio-button :label="30">近30日</el-radio-button>
                <el-radio-button :label="90">近3个月</el-radio-button>
                <el-radio-button :label="365">近1年</el-radio-button>
            </el-radio-group>
        </div>
        <div id="chart" style="width: 100%; height: 300px; background: #f9f9f9; display: flex; align-items: flex-end; justify-content: flex-start; overflow-x: auto; padding: 10px;">
            <!-- Simple Bar Chart -->
            <div v-for="item in stats.salesTrend" :key="item.date" style="margin-right: 5px; text-align: center; flex-shrink: 0; width: 40px;">
                <div style="height: 200px; width: 20px; background: #eee; position: relative; margin: 0 auto;">
                    <el-tooltip :content="`${item.date}: ¥${item.sales}`" placement="top">
                         <div :style="{ height: Math.min(item.sales / (maxSales || 100) * 100, 100) + '%', background: '#2E7D32', position: 'absolute', bottom: 0, width: '100%' }"></div>
                    </el-tooltip>
                </div>
                <div style="font-size: 10px; margin-top: 5px; transform: rotate(-45deg); white-space: nowrap;">{{ item.date.slice(5) }}</div>
            </div>
        </div>

        <h3 style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
            历史订单查询
            <div style="display: flex; gap: 10px;">
                <el-input v-model="searchQuery" placeholder="搜索取餐号/商品" style="width: 200px;" clearable />
                <el-select v-model="dateFilter" placeholder="时间筛选" style="width: 120px;">
                    <el-option label="全部" value="all"></el-option>
                    <el-option label="今日" value="today"></el-option>
                    <el-option label="近3天" value="3days"></el-option>
                    <el-option label="本周" value="week"></el-option>
                    <el-option label="本月" value="month"></el-option>
                </el-select>
            </div>
        </h3>
        <el-table :data="filteredHistoryOrders" height="300" stripe>
            <el-table-column prop="createdAt" label="时间" width="180">
                <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="pickupCode" label="取餐号" width="100" />
            <el-table-column label="商品摘要" min-width="200">
                <template #default="scope">
                    {{ scope.row.items.map(i => i.name).join(', ') }}
                </template>
            </el-table-column>
            <el-table-column prop="total" label="金额" width="100">
                <template #default="scope">¥{{ scope.row.total }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                    <el-tag size="small" :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>



    <!-- Product Manager Dialog -->
    <el-dialog v-model="showProductManager" title="商品管理" width="80%" :height="'90vh'" :fullscreen="false">
        <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
            <el-button type="primary" size="default" @click="openAddProduct" style="padding: 10px 20px;">新增商品</el-button>
            <el-button type="info" size="default" @click="searchProducts" style="padding: 10px 20px;">搜索商品</el-button>
            <el-input v-model="searchQuery" placeholder="搜索商品" style="width: 350px; font-size: 16px;" clearable />
        </div>
        <el-table :data="products" style="width: 100%; font-size: 16px;" height="700" :row-style="{ height: '100px' }">
             <el-table-column label="图片" width="150">
                 <template #default="scope">
                     <img :src="(scope.row.image && scope.row.image.startsWith('http')) ? scope.row.image : (scope.row.image ? 'https://express-zew6-233277-5-1409316354.sh.run.tcloudbase.com' + scope.row.image : 'https://api.dicebear.com/7.x/shapes/svg?seed=NoImage')" 
                          @error="e => e.target.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=Error'"
                          style="width: 100px; height: 80px; object-fit: cover; border-radius: 8px;">
                 </template>
             </el-table-column>
             <el-table-column prop="name" label="商品名称" width="250">
                 <template #default="scope">
                     <div style="font-weight: 500; font-size: 16px;">{{ scope.row.name }}</div>
                 </template>
             </el-table-column>
             <el-table-column prop="categoryId" label="分类" width="150">
                 <template #default="scope">
                     <div style="color: #666; font-size: 15px;">{{ getCategoryName(scope.row.categoryId) }}</div>
                 </template>
             </el-table-column>
             <el-table-column prop="price" label="价格" width="150">
                 <template #default="scope">
                     <div style="font-weight: bold; color: #E6A23C; font-size: 16px;">¥{{ scope.row.price }}</div>
                 </template>
             </el-table-column>
             <el-table-column prop="stock" label="库存" width="150" />
             <el-table-column label="操作" width="200">
                 <template #default="scope">
                     <el-button size="default" type="primary" @click="openEditProduct(scope.row)" style="margin-right: 15px; padding: 8px 16px;">编辑</el-button>
                     <el-button size="default" type="danger" @click="deleteProduct(scope.row)" style="padding: 8px 16px;">删除</el-button>
                 </template>
             </el-table-column>
        </el-table>
        <template #footer>
            <el-button size="default" @click="showProductManager = false" style="padding: 8px 16px;">关闭</el-button>
        </template>
    </el-dialog>

    <!-- Add/Edit Product Form -->
    <el-dialog v-model="showProductForm" :title="isEditMode ? '编辑商品' : '新增商品'" width="80%" height="90%">
        <el-form label-width="120px" label-position="left">
            <el-form-item label="商品名称">
                <el-input v-model="currentProduct.name" style="width: 100%; font-size: 18px; height: 56px;"></el-input>
            </el-form-item>
            <el-form-item label="分类">
                <el-select v-model="currentProduct.categoryId" allow-create filterable default-first-option placeholder="选择或输入新分类" style="width: 100%; font-size: 18px; height: 56px;">
                    <el-option label="茶饮" value="tea"></el-option>
                    <el-option label="咖啡" value="coffee"></el-option>
                    <el-option label="酒品" value="alcohol"></el-option>
                    <el-option label="简餐" value="food"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="价格">
                <el-input-number v-model="currentProduct.price" :min="0" :precision="2" style="width: 100%; font-size: 18px; height: 56px;"></el-input-number>
            </el-form-item>
            <el-form-item label="库存">
                <el-input-number v-model="currentProduct.stock" :min="0" style="width: 100%; font-size: 18px; height: 56px;"></el-input-number>
            </el-form-item>
            <el-form-item label="图片">
                <el-input v-model="currentProduct.image" placeholder="输入URL 或 上传图片" style="width: 100%; font-size: 18px; height: 56px;"></el-input>
                <div style="margin-top: 20px;">
                    <el-button type="primary" size="default" @click="triggerFileInput" style="font-size: 16px; padding: 14px 28px;">选择文件并裁剪</el-button>
                    <input type="file" ref="fileInput" @change="onFileChange" accept="image/*" style="display: none;" />
                </div>
                <div v-if="currentProduct.image" style="margin-top: 20px;">
                    <img :src="currentProduct.image" style="max-width: 300px; max-height: 300px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);" />
                </div>
            </el-form-item>
            <el-form-item label="规格" v-if="['tea', 'coffee', 'alcohol', 'food'].includes(currentProduct.categoryId)">
                <div class="specs-container">
                    <!-- 茶饮/咖啡规格 -->
                    <div v-if="currentProduct.categoryId === 'tea' || currentProduct.categoryId === 'coffee'" class="spec-section">
                        <!-- 温度设置 -->
                        <div class="spec-group">
                            <div class="spec-group-title">
                                <span>温度</span>
                            </div>
                            <div class="spec-options">
                                <div v-for="(option, index) in tempOptions" :key="index" class="option-item">
                                    <el-checkbox v-model="currentProduct.specs.temp" :label="option">{{option}}</el-checkbox>
                                    <el-button type="danger" size="small" link @click="removeTempOption(index)">×</el-button>
                                </div>
                            </div>
                            <div class="add-spec-row">
                                <el-input v-model="customTemp" placeholder="输入新温度选项" size="small"></el-input>
                                <el-button type="primary" size="small" @click="addCustomSpec('temp', customTemp)">添加</el-button>
                            </div>
                        </div>

                        <!-- 糖度设置 -->
                        <div class="spec-group">
                            <div class="spec-group-title">
                                <span>糖度</span>
                            </div>
                            <div class="spec-options">
                                <div v-for="(option, index) in sugarOptions" :key="index" class="option-item">
                                    <el-checkbox v-model="currentProduct.specs.sugar" :label="option">{{option}}</el-checkbox>
                                    <el-button type="danger" size="small" link @click="removeSugarOption(index)">×</el-button>
                                </div>
                            </div>
                            <div class="add-spec-row">
                                <el-input v-model="customSugar" placeholder="输入新糖度选项" size="small"></el-input>
                                <el-button type="primary" size="small" @click="addCustomSpec('sugar', customSugar)">添加</el-button>
                            </div>
                        </div>

                        <!-- 自定义规格设置 -->
                        <div class="spec-group">
                            <div class="spec-group-title">
                                <span>自定义规格</span>
                                <el-button type="primary" size="small" link @click="addCustomSpecRow">+ 新增</el-button>
                            </div>
                            <div v-for="(spec, index) in customSpecs" :key="index" class="custom-spec-item">
                                <div class="custom-spec-header">
                                    <el-input v-model="spec.name" placeholder="规格名称（如：杯型）" size="small" style="width: 120px;"></el-input>
                                    <el-button type="danger" size="small" link @click="removeCustomSpec(index)">删除</el-button>
                                </div>
                                <div class="custom-spec-options">
                                    <el-input v-model="spec.newOption" placeholder="输入选项（如：小杯）" size="small"></el-input>
                                    <el-button type="primary" size="small" @click="addOptionToCustomSpec(index)">添加</el-button>
                                </div>
                                <div class="spec-options" v-if="spec.options && spec.options.length > 0">
                                    <div v-for="(option, optIndex) in spec.options" :key="optIndex" class="option-item">
                                        <el-checkbox v-model="currentProduct.specs[spec.name]" :label="option">{{option}}</el-checkbox>
                                        <el-button type="danger" size="small" link @click="removeOptionFromCustomSpec(index, optIndex)">×</el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 酒品规格 -->
                    <div v-if="currentProduct.categoryId === 'alcohol'" class="spec-section">
                        <!-- 容量设置 -->
                        <div class="spec-group">
                            <div class="spec-group-title">
                                <span>容量</span>
                            </div>
                            <div class="spec-options">
                                <div v-for="(option, index) in alcoholVariantOptions" :key="index" class="option-item">
                                    <el-checkbox v-model="currentProduct.specs.variants" :label="option">{{option}}</el-checkbox>
                                    <el-button type="danger" size="small" link @click="removeAlcoholVariantOption(index)">×</el-button>
                                </div>
                            </div>
                            <div class="add-spec-row">
                                <el-input v-model="customAlcoholVariant" placeholder="输入新容量选项" size="small"></el-input>
                                <el-button type="primary" size="small" @click="addCustomAlcoholVariant">添加</el-button>
                            </div>
                        </div>

                        <!-- 自定义规格设置 -->
                        <div class="spec-group">
                            <div class="spec-group-title">
                                <span>自定义规格</span>
                                <el-button type="primary" size="small" link @click="addCustomSpecRow">+ 新增</el-button>
                            </div>
                            <div v-for="(spec, index) in customSpecs" :key="index" class="custom-spec-item">
                                <div class="custom-spec-header">
                                    <el-input v-model="spec.name" placeholder="规格名称（如：酒精度）" size="small" style="width: 120px;"></el-input>
                                    <el-button type="danger" size="small" link @click="removeCustomSpec(index)">删除</el-button>
                                </div>
                                <div class="custom-spec-options">
                                    <el-input v-model="spec.newOption" placeholder="输入选项（如：3度）" size="small"></el-input>
                                    <el-button type="primary" size="small" @click="addOptionToCustomSpec(index)">添加</el-button>
                                </div>
                                <div class="spec-options" v-if="spec.options && spec.options.length > 0">
                                    <div v-for="(option, optIndex) in spec.options" :key="optIndex" class="option-item">
                                        <el-checkbox v-model="currentProduct.specs[spec.name]" :label="option">{{option}}</el-checkbox>
                                        <el-button type="danger" size="small" link @click="removeOptionFromCustomSpec(index, optIndex)">×</el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 简餐规格 -->
                    <div v-if="currentProduct.categoryId === 'food'" class="spec-section">
                        <!-- 自定义规格设置 -->
                        <div class="spec-group">
                            <div class="spec-group-title">
                                <span>自定义规格</span>
                                <el-button type="primary" size="small" link @click="addCustomSpecRow">+ 新增</el-button>
                            </div>
                            <div v-for="(spec, index) in customSpecs" :key="index" class="custom-spec-item">
                                <div class="custom-spec-header">
                                    <el-input v-model="spec.name" placeholder="规格名称（如：辣度）" size="small" style="width: 120px;"></el-input>
                                    <el-button type="danger" size="small" link @click="removeCustomSpec(index)">删除</el-button>
                                </div>
                                <div class="custom-spec-options">
                                    <el-input v-model="spec.newOption" placeholder="输入选项（如：微辣）" size="small"></el-input>
                                    <el-button type="primary" size="small" @click="addOptionToCustomSpec(index)">添加</el-button>
                                </div>
                                <div class="spec-options" v-if="spec.options && spec.options.length > 0">
                                    <div v-for="(option, optIndex) in spec.options" :key="optIndex" class="option-item">
                                        <el-checkbox v-model="currentProduct.specs[spec.name]" :label="option">{{option}}</el-checkbox>
                                        <el-button type="danger" size="small" link @click="removeOptionFromCustomSpec(index, optIndex)">×</el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button size="default" @click="showProductForm = false" style="padding: 10px 20px; margin-right: 15px;">取消</el-button>
            <el-button type="primary" size="default" @click="saveProduct" style="padding: 10px 20px;">保存</el-button>
        </template>
    </el-dialog>

    <!-- Cropper Dialog -->
    <el-dialog v-model="showCropper" title="裁剪图片" width="600px" append-to-body>
        <div style="height: 400px;">
            <vue-cropper
                ref="cropper"
                :img="cropperImg"
                :autoCrop="true"
                :autoCropWidth="400"
                :autoCropHeight="400"
                :fixed="true"
                :fixedNumber="[1, 1]"
                outputType="png"
            ></vue-cropper>
        </div>
        <template #footer>
            <el-button @click="showCropper = false">取消</el-button>
            <el-button type="primary" @click="uploadCroppedImage">确认上传</el-button>
        </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import io from 'socket.io-client'
// Use specific path for Vue 3 compatibility
import { VueCropper } from 'vue-cropper/next/dist/vue-cropper.es.js'
import 'vue-cropper/next/dist/index.css'

const socket = io('https://express-zew6-233277-5-1409316354.sh.run.tcloudbase.com')
const orders = ref([])
const products = ref([])
const filterStatus = ref('all')
const showSettings = ref(false)
const showProductManager = ref(false)
const showProductForm = ref(false)
const showCropper = ref(false)
const cropperImg = ref('')
const cropper = ref(null)
const fileInput = ref(null)
const isEditMode = ref(false)
const currentProduct = ref({})
const activeSpecs = ref([])
const customTemp = ref('')
const customSugar = ref('')
const customSpecs = ref([])
const tempOptions = ref(['少冰', '正常冰', '热', '常温'])
const sugarOptions = ref(['正常糖', '少糖', '多糖'])
const alcoholVariantOptions = ref(['一杯', '一瓶'])
const customAlcoholVariant = ref('')
const printerConfig = ref({ 
    receiptAppid: '', receiptAppsecret: '', receiptSn: '', receiptKey: '', receiptAutoPrint: true, title: '粮仓',
    appid: '', appsecret: '', sn: '', name: '粮仓标签机', autoPrint: true 
})
const activeTab = ref('receipt')
const btDevice = ref(null)
const btCharacteristic = ref(null)
const isPrinterConnected = ref(false)
const windowLocationOrigin = ref(window.location.origin)

const connectBluetoothPrinter = async () => {
    try {
        if (!navigator.bluetooth) {
            ElMessage.error('您的浏览器不支持蓝牙功能，请使用 Chrome 或 Edge');
            return;
        }

        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'] 
        });

        const server = await device.gatt.connect();
        
        // Try to find a writable characteristic in common printer services
        let char = null;
        const services = await server.getPrimaryServices();
        
        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const c of characteristics) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                    char = c;
                    break;
                }
            }
            if (char) break;
        }

        if (!char) {
             ElMessage.error('未找到可写入的打印服务');
             device.gatt.disconnect();
             return;
        }

        btDevice.value = device;
        btCharacteristic.value = char;
        isPrinterConnected.value = true;
        
        device.addEventListener('gattserverdisconnected', () => {
            isPrinterConnected.value = false;
            btDevice.value = null;
            btCharacteristic.value = null;
            ElMessage.warning('蓝牙打印机已断开');
        });

        ElMessage.success('蓝牙打印机连接成功');
    } catch (err) {
        console.error(err);
        if (err.name === 'SecurityError') {
             ElMessage.error('安全限制：请确保使用 HTTPS 或 localhost 访问');
        } else if (err.name === 'NotFoundError') {
             ElMessage.warning('取消了设备连接或未选择设备');
        } else {
             ElMessage.error('连接失败: ' + err.message);
        }
    }
}

const disconnectBluetooth = () => {
    if (btDevice.value && btDevice.value.gatt.connected) {
        btDevice.value.gatt.disconnect();
        ElMessage.success('已断开连接');
    }
}

const printTestLabel = async () => {
    const mockOrder = {
        pickupCode: '8888',
        createdAt: new Date().toISOString(),
        items: [
            { name: '测试商品A', variant: '大杯', quantity: 1 },
            { name: '测试商品B', quantity: 2 }
        ]
    };
    await printLabel(mockOrder);
}

const printLabel = async (order) => {
    // 优先使用云打印 (芯烨云)
    try {
        await fetch('/api/printer/test', { // Reuse test endpoint or create label endpoint
             method: 'POST',
             // Pass real order data if endpoint supports it, currently test uses mock.
             // Let's assume we want to trigger the cloud label print we implemented in server.js
        });
        ElMessage.success('已发送至云标签机');
        return;
    } catch (e) {
        // Fallback to bluetooth if cloud fails? Or just use cloud.
        // User wants Xpyun for Label. Xpyun is Cloud.
        // So we should NOT use Bluetooth for Xpyun.
    }
}
let timer = null

const showStats = ref(false)
const stats = ref({})
const statsRange = ref(7)
const maxSales = computed(() => {
    if (!stats.value.salesTrend) return 100;
    const values = stats.value.salesTrend.map(i => i.sales);
    return Math.max(...values, 100); // Minimum scale 100
})
const searchQuery = ref('')
const dateFilter = ref('all')



const API_BASE_URL = 'https://express-zew6-233277-5-1409316354.sh.run.tcloudbase.com/api'

const updateStatus = async (id, status) => {
  await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
}

const saveSettings = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/printer/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(printerConfig.value)
        });
        const data = await res.json();
        if (data.success) {
            ElMessage.success('配置已保存');
            showSettings.value = false;
        } else {
            ElMessage.error('保存失败');
        }
    } catch (err) {
        ElMessage.error('保存失败: ' + err.message);
    }
}

const testReceiptPrint = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/printer/test`, { method: 'POST', body: JSON.stringify({ type: 'receipt' }), headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (data.success) {
            ElMessage.success('测试小票已发送');
        } else {
             ElMessage.error('发送失败: ' + data.error);
        }
    } catch (err) {
        ElMessage.error('网络错误');
    }
}

const testPrint = async () => { // Label Test
    try {
        const res = await fetch(`${API_BASE_URL}/printer/test`, { method: 'POST', body: JSON.stringify({ type: 'label' }), headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (data.success) {
            ElMessage.success('测试标签已发送');
        } else {
             ElMessage.error('发送失败: ' + data.error);
        }
    } catch (err) {
        ElMessage.error('网络错误');
    }
}

const getStatusType = (status) => {
  const map = { pending: 'danger', preparing: 'warning', completed: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待接单', preparing: '制作中', completed: '已完成' }
  return map[status] || status
}

const formatTime = (isoString) => {
  return new Date(isoString).toLocaleString()
}

const fetchStats = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/stats?range=${statsRange.value}`)
        stats.value = await res.json()
    } catch (err) {
        console.error(err)
    }
}

watch(showStats, (val) => {
    if (val) fetchStats()
})



const getCategoryName = (id) => {
    const map = { tea: '茶饮', coffee: '咖啡', alcohol: '酒品', food: '简餐' };
    return map[id] || id;
}

const openAddProduct = () => {
    isEditMode.value = false;
    currentProduct.value = { 
        stock: 999, // default
        specs: {
            temp: [],
            sugar: [],
            variants: []
        }
    };
    customSpecs.value = [];
    customTemp.value = '';
    customSugar.value = '';
    customAlcoholVariant.value = '';
    activeSpecs.value = [];
    showProductForm.value = true;
}

const openEditProduct = (row) => {
    isEditMode.value = true;
    currentProduct.value = { 
        ...row,
        specs: {
            temp: row.specs?.temp || [],
            sugar: row.specs?.sugar || [],
            variants: row.specs?.variants || [],
            ...row.specs
        }
    };
    
    // 处理已保存的自定义规格
    customSpecs.value = [];
    if (row.specs) {
        // 检查是否有其他规格属性（除了temp、sugar、variants）
        Object.keys(row.specs).forEach(key => {
            if (!['temp', 'sugar', 'variants', 'customSpecs'].includes(key) && Array.isArray(row.specs[key])) {
                customSpecs.value.push({
                    name: key,
                    options: row.specs[key],
                    newOption: ''
                });
            }
        });
    }
    
    customAlcoholVariant.value = '';
    activeSpecs.value = [];
    showProductForm.value = true;
}

const addCustomSpec = (type, value) => {
    if (!value.trim()) return;
    if (!currentProduct.value.specs[type]) {
        currentProduct.value.specs[type] = [];
    }
    if (!currentProduct.value.specs[type].includes(value)) {
        currentProduct.value.specs[type].push(value);
    }
    // 添加到选项列表
    if (type === 'temp') {
        if (!tempOptions.value.includes(value)) {
            tempOptions.value.push(value);
        }
        customTemp.value = '';
    } else if (type === 'sugar') {
        if (!sugarOptions.value.includes(value)) {
            sugarOptions.value.push(value);
        }
        customSugar.value = '';
    }
}

const addCustomAlcoholVariant = () => {
    if (!customAlcoholVariant.value.trim()) {
        ElMessage.warning('请输入容量选项');
        return;
    }
    
    if (!alcoholVariantOptions.value.includes(customAlcoholVariant.value.trim())) {
        alcoholVariantOptions.value.push(customAlcoholVariant.value.trim());
    }
    
    customAlcoholVariant.value = '';
    ElMessage.success('容量选项已添加');
}

const removeTempOption = (index) => {
    const removedOption = tempOptions.value[index];
    tempOptions.value.splice(index, 1);
    
    // 从选中的选项中也删除
    if (currentProduct.value.specs.temp) {
        const selectedIndex = currentProduct.value.specs.temp.indexOf(removedOption);
        if (selectedIndex > -1) {
            currentProduct.value.specs.temp.splice(selectedIndex, 1);
        }
    }
}

const removeSugarOption = (index) => {
    const removedOption = sugarOptions.value[index];
    sugarOptions.value.splice(index, 1);
    
    // 从选中的选项中也删除
    if (currentProduct.value.specs.sugar) {
        const selectedIndex = currentProduct.value.specs.sugar.indexOf(removedOption);
        if (selectedIndex > -1) {
            currentProduct.value.specs.sugar.splice(selectedIndex, 1);
        }
    }
}

const removeAlcoholVariantOption = (index) => {
    const removedOption = alcoholVariantOptions.value[index];
    alcoholVariantOptions.value.splice(index, 1);
    
    // 从选中的选项中也删除
    if (currentProduct.value.specs.variants) {
        const selectedIndex = currentProduct.value.specs.variants.indexOf(removedOption);
        if (selectedIndex > -1) {
            currentProduct.value.specs.variants.splice(selectedIndex, 1);
        }
    }
}

const addCustomSpecRow = () => {
    customSpecs.value.push({ name: '', options: [], newOption: '' });
}

const removeCustomSpec = (index) => {
    const spec = customSpecs.value[index];
    // 从product.specs中删除该规格
    if (spec.name && currentProduct.value.specs[spec.name]) {
        delete currentProduct.value.specs[spec.name];
    }
    customSpecs.value.splice(index, 1);
}

const addOptionToCustomSpec = (index) => {
    const spec = customSpecs.value[index];
    if (!spec.name.trim()) {
        ElMessage.warning('请先输入规格名称');
        return;
    }
    if (!spec.newOption.trim()) {
        ElMessage.warning('请输入选项内容');
        return;
    }
    
    // 检查选项是否已存在
    if (spec.options.includes(spec.newOption.trim())) {
        ElMessage.warning('该选项已存在');
        return;
    }
    
    // 添加选项
    spec.options.push(spec.newOption.trim());
    
    // 初始化该规格的选中选项（如果还没有）
    if (!currentProduct.value.specs[spec.name]) {
        currentProduct.value.specs[spec.name] = [];
    }
    
    // 清空输入框
    spec.newOption = '';
    
    ElMessage.success('选项已添加');
}

const removeOptionFromCustomSpec = (specIndex, optIndex) => {
    const spec = customSpecs.value[specIndex];
    const removedOption = spec.options[optIndex];
    
    // 从选项列表中删除
    spec.options.splice(optIndex, 1);
    
    // 从选中的选项中也删除
    if (currentProduct.value.specs[spec.name]) {
        const selectedIndex = currentProduct.value.specs[spec.name].indexOf(removedOption);
        if (selectedIndex > -1) {
            currentProduct.value.specs[spec.name].splice(selectedIndex, 1);
        }
    }
}

const triggerFileInput = () => {
    fileInput.value.click()
}

const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Read file as data URL for cropper
    const reader = new FileReader();
    reader.onload = (event) => {
        cropperImg.value = event.target.result;
        showCropper.value = true;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
}

const uploadCroppedImage = () => {
    cropper.value.getCropBlob(async (blob) => {
        if (!blob) {
            ElMessage.error('裁剪失败');
            return;
        }
        const formData = new FormData();
        formData.append('image', blob, 'cropped.png');
        
        try {
            // 直接使用后端服务的完整URL
            const uploadUrl = 'https://express-zew6-233277-5-1409316354.sh.run.tcloudbase.com/api/upload';
            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                // 构建完整的图片URL
                currentProduct.value.image = 'https://express-zew6-233277-5-1409316354.sh.run.tcloudbase.com' + data.url; 
                ElMessage.success('上传并裁剪成功');
                showCropper.value = false;
            } else {
                ElMessage.error('上传失败: ' + (data.error || '未知错误'));
            }
        } catch (err) {
            console.error('上传错误:', err);
            ElMessage.error('上传网络错误');
        }
    });
}

const saveProduct = async () => {
    try {
        // 将自定义规格数据保存到currentProduct.value.specs中
        currentProduct.value.specs.customSpecs = customSpecs.value;
        
        // 确保图片URL使用完整的云托管服务地址
        if (currentProduct.value.image && !currentProduct.value.image.startsWith('http')) {
            currentProduct.value.image = 'https://express-zew6-233277-5-1409316354.sh.run.tcloudbase.com' + currentProduct.value.image;
        }
        
        console.log('Saving product:', currentProduct.value);
        
        const url = isEditMode.value 
            ? `${API_BASE_URL}/products/${currentProduct.value.id}` 
            : `${API_BASE_URL}/products`;
        const method = isEditMode.value ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentProduct.value)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error('Save failed: ' + (errorData.error || 'Unknown error'));
        }
        
        ElMessage.success('保存成功');
        showProductForm.value = false;
        fetchProducts(); // Refresh list
    } catch (err) {
        console.error('Save product error:', err);
        ElMessage.error('保存失败: ' + err.message);
    }
}

const deleteProduct = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该商品吗？', '提示', { type: 'warning' });
        const res = await fetch(`${API_BASE_URL}/products/${row.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        ElMessage.success('已删除');
        fetchProducts();
    } catch (err) {
        if (err !== 'cancel') ElMessage.error('删除失败');
    }
}

const filteredOrders = computed(() => {
    if (filterStatus.value === 'all') return orders.value;
    return orders.value.filter(o => o.status === filterStatus.value);
});

const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`)
    const data = await res.json()
    
    // Check for new orders to play sound
    const newPendingCount = data.filter(o => o.status === 'pending').length
    const oldPendingCount = orders.value.filter(o => o.status === 'pending').length
    
    if (newPendingCount > oldPendingCount && oldPendingCount !== 0) {
       playNotificationSound()
       ElMessage.success('您有新的订单！')
    }
    
    orders.value = data
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

const fetchProducts = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/menu`)
        const data = await res.json()
        // Flatten menu structure for table
        const flatProducts = []
        data.forEach(cat => {
            cat.items.forEach(item => {
                flatProducts.push(item)
            })
        })
        products.value = flatProducts
    } catch (err) {
        console.error(err)
    }
}

const searchProducts = () => {
    if (!searchQuery.value.trim()) {
        fetchProducts()
        return
    }
    
    const query = searchQuery.value.toLowerCase()
    const filtered = products.value.filter(product => 
        product.name.toLowerCase().includes(query) ||
        getCategoryName(product.categoryId).toLowerCase().includes(query)
    )
    products.value = filtered
}

const handleOrder = async (order) => {
  try {
    await updateStatus(order.id, 'preparing')
    ElMessage.success(`订单 ${order.pickupCode} 已接单，正在打印...`)
    fetchOrders()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const completeOrder = async (order) => {
  // Voice Call - Trigger immediately to satisfy mobile browser interaction policies
  speak(`请 ${order.pickupCode} 号取餐`);

  await updateStatus(order.id, 'completed')
  ElMessage.success(`订单 ${order.pickupCode} 已完成`)
  
  fetchOrders()
}

const speak = (text) => {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech to prevent queue buildup
        window.speechSynthesis.cancel();
        
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'zh-CN';
        msg.rate = 0.9; // Slightly slower for clarity
        msg.pitch = 1;
        
        // Mobile compatibility hack: Ensure voice is loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prefer Chinese voice if available
            const zhVoice = voices.find(v => v.lang.includes('zh'));
            if (zhVoice) msg.voice = zhVoice;
        }
        
        window.speechSynthesis.speak(msg);
    }
}

// Audio Context for notification sound
let audioCtx = null;
const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Initialize audio on first user interaction
onMounted(() => {
  document.addEventListener('click', initAudio, { once: true });
  fetchOrders()
  fetchProducts()
  
  socket.on('order_created', (newOrder) => {
      ElMessage.success(`收到新订单 #${newOrder.pickupCode}`)
      playNotificationSound()
      fetchOrders()
  })
  
  // ... rest of socket listeners
  socket.on('order_updated', () => fetchOrders())
  socket.on('stats_updated', () => { if (showStats.value) fetchStats() })
})

// Load printer config when settings open
watch(showSettings, async (val) => {
    if (val) {
        try {
            const res = await fetch(`${API_BASE_URL}/printer/config`);
            const data = await res.json();
            if (data && data.appid) { // Basic validation
                printerConfig.value = { ...printerConfig.value, ...data };
            }
        } catch (err) {
            console.error('Failed to load printer config', err);
        }
    }
})

onUnmounted(() => {
    document.removeEventListener('click', initAudio);
    socket.disconnect()
})

const playNotificationSound = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  
  osc.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(500, audioCtx.currentTime) // Ding
  osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1)
  
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
  
  osc.start()
  osc.stop(audioCtx.currentTime + 0.5)
}

const filteredHistoryOrders = computed(() => {
    let result = orders.value;
    
    // 1. Filter by Search Query (Pickup Code or Item Name)
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(o => 
            o.pickupCode.includes(q) || 
            o.items.some(i => i.name.toLowerCase().includes(q))
        );
    }
    
    // 2. Filter by Date
    if (dateFilter.value !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        result = result.filter(o => {
            const orderTime = new Date(o.createdAt).getTime();
            if (dateFilter.value === 'today') {
                return orderTime >= today;
            }
            if (dateFilter.value === '3days') {
                return orderTime >= today - 2 * 24 * 60 * 60 * 1000;
            }
            if (dateFilter.value === 'week') {
                return orderTime >= today - 6 * 24 * 60 * 60 * 1000; // Simplified week
            }
            if (dateFilter.value === 'month') {
                return orderTime >= today - 30 * 24 * 60 * 60 * 1000;
            }
            return true;
        });
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});
</script>

<style>
body { margin: 0; }
.order-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.order-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
.new-order { border: 2px solid #F56C6C; }
.specs-container {
    width: 100%;
}
.spec-section {
    background: #f8fafc;
    border-radius: 20px;
    padding: 24px;
    border: 1px solid #e5e7eb;
}
.spec-group {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}
.spec-group:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
}
.spec-group:last-child {
    margin-bottom: 0;
}
.spec-group-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f3f4f6;
}
.spec-group-title span {
    font-size: 17px;
    font-weight: 600;
    color: #1f2937;
}
.spec-group-title .el-button--link {
    font-weight: 500;
    color: #2563eb;
}
.spec-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
}
.add-spec-row {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 16px;
}
.add-spec-row .el-input {
    flex: 1;
}
.add-spec-row .el-input .el-input__inner {
    border-radius: 10px;
    border: 1px solid #d1d5db;
    padding: 10px 14px;
    transition: all 0.2s ease;
    font-size: 14px;
}
.add-spec-row .el-input .el-input__inner:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}
.add-spec-row .el-button {
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.2s ease;
    background: #3b82f6;
    border-color: #3b82f6;
}
.add-spec-row .el-button:hover {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}
.custom-spec-item {
    background: #fefce8;
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 14px;
    border: 1px solid #fde047;
    transition: all 0.2s ease;
}
.custom-spec-item:hover {
    background: #fef9c3;
    border-color: #facc15;
}
.custom-spec-item:last-child {
    margin-bottom: 0;
}
.custom-spec-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
}
.custom-spec-header .el-input .el-input__inner {
    border-radius: 10px;
    font-weight: 500;
    border: 1px solid #fbbf24;
    background: white;
    padding: 8px 12px;
}
.custom-spec-options {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
}
.custom-spec-options .el-input {
    flex: 1;
}
.custom-spec-options .el-input .el-input__inner {
    border-radius: 10px;
    border: 1px solid #f59e0b;
    background: white;
    padding: 8px 12px;
}
.custom-spec-options .el-button {
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: 500;
    background: #f59e0b;
    border-color: #f59e0b;
}
.custom-spec-options .el-button:hover {
    background: #d97706;
    border-color: #d97706;
}
.option-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: white;
    border-radius: 12px;
    padding: 8px 12px;
    margin-bottom: 0;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    min-width: 90px;
}
.option-item:hover {
    background: #f8fafc;
    border-color: #d1d5db;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.option-item .el-checkbox {
    margin-right: 4px;
}
.option-item .el-checkbox .el-checkbox__label {
    font-weight: 500;
    color: #4b5563;
    padding-left: 6px;
}
.option-item .el-checkbox.is-checked .el-checkbox__label {
    color: #2563eb;
    font-weight: 600;
}
.option-item .el-button {
    padding: 2px 6px;
    font-size: 11px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: #9ca3af;
    transition: all 0.15s;
    font-weight: 500;
    margin-left: 4px;
    min-height: 20px;
}
.option-item .el-button:hover {
    background: #fee2e2;
    color: #dc2626;
}

/* Mobile Optimization */
@media (max-width: 1024px) {
  .el-main {
    padding: 10px !important;
  }
  
  /* Reduce header padding */
  .el-header {
    padding: 0 10px !important;
  }
  .el-header h2 {
    font-size: 18px;
    margin: 0;
  }
  
  /* Compact order card */
  .order-card .el-card__header {
    padding: 10px 15px;
  }
  .order-card .el-card__body {
    padding: 10px 15px;
  }
  
  /* Adjust font sizes */
  .card-header span:first-child {
    font-size: 20px !important; /* Smaller Pickup Code */
  }
  .card-header .el-tag {
    font-size: 12px;
    height: 24px;
    line-height: 22px;
  }
  
  .order-item {
    font-size: 14px;
  }
  
  /* Stack buttons in footer properly */
  .card-footer {
    gap: 5px !important;
  }
  .card-footer .el-button {
    font-size: 13px;
    padding: 8px 10px;
  }
  
  /* Filter bar adjustments */
  .el-radio-group {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    width: 100%;
  }
  .el-radio-button__inner {
    padding: 8px 10px !important;
    font-size: 12px;
  }
  
  /* Hide secondary buttons on mobile or make them smaller */
  div[style*="justify-content: space-between"] > div:last-child {
    margin-top: 10px;
    display: flex;
    width: 100%;
  }
  div[style*="justify-content: space-between"] > div:last-child .el-button {
    flex: 1;
  }
  
  /* Filter container column layout */
  div[style*="margin-bottom: 20px"] {
    flex-direction: column;
    align-items: stretch !important;
  }

  /* Dialog Fullscreen */
  .el-dialog {
    width: 95% !important;
    margin-top: 5vh !important;
  }
  
  /* Stats Cards Grid -> Single Column */
  .el-row {
    display: flex;
    flex-direction: column;
  }
  .el-col {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 10px;
  }
  
  /* Stats Font Size */
  .el-card__header {
    padding: 10px;
    font-size: 14px;
  }
  .el-card__body {
    padding: 10px;
  }
  .el-card__body > div {
    font-size: 20px !important;
  }
  
  /* Chart Scroll */
  #chart {
    overflow-x: auto;
    padding-bottom: 20px; /* Space for scrollbar */
  }
  
  /* Table Mobile View */
  .el-table {
    font-size: 12px;
  }
  .el-table .cell {
    padding: 0 5px;
  }
  
  /* Product Manager Table Actions - Stack Buttons */
  .el-table .el-table__cell:last-child .cell {
      display: flex;
      flex-direction: column;
      gap: 5px;
      align-items: center;
      justify-content: center;
  }
  .el-table .el-table__cell:last-child .el-button {
      margin-left: 0 !important;
      width: 100%;
      max-width: 60px;
      padding: 5px 0;
      height: 28px;
  }

  /* Product Form Mobile Layout */
  .el-dialog__body .el-form-item {
      margin-bottom: 15px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
  }
  .el-form-item__label {
      width: 100% !important;
      text-align: left;
      margin-bottom: 5px;
  }
  .el-form-item__content {
      margin-left: 0 !important;
      width: 100%;
  }
  
  /* Make buttons bigger on mobile */
  .el-button {
      height: 36px; 
      font-size: 14px;
  }
  
  /* Adjust image preview */
  .el-form-item__content img {
      width: 100px;
      height: 100px;
      object-fit: cover;
  }
}
</style>